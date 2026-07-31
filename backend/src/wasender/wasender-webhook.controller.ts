import { Body, Controller, Headers, HttpCode, Logger, Post, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('webhooks')
export class WasenderWebhookController {
  private readonly logger = new Logger(WasenderWebhookController.name);

  constructor(private prisma: PrismaService) {}

  @Public()
  @Post('wasender')
  @HttpCode(200)
  async handle(@Headers('x-webhook-signature') signature: string, @Body() body: any) {
    const expected = process.env.WASENDER_WEBHOOK_SECRET;
    if (!expected || !signature || signature !== expected) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = body?.event;
    const data = body?.data;

    try {
      switch (event) {
        case 'messages.upsert':
        case 'message.received':
          if (!data?.key?.fromMe) {
            await this.handleInboundMessage(data);
          }
          break;

        case 'message.sent':
          await this.handleOutboundAck(data);
          break;

        case 'messages.update':
        case 'message.update':
          await this.handleStatusUpdate(data);
          break;

        case 'session.status':
          this.logger.log(`WhatsApp session status: ${data?.status}`);
          break;

        default:
          this.logger.debug(`Unhandled WaSenderAPI event: ${event}`);
      }
    } catch (err) {
      this.logger.error(`Failed to process webhook event "${event}": ${err}`);
    }

    return { received: true };
  }

  private async handleInboundMessage(data: any) {
    const remoteJid: string | undefined = data?.key?.remoteJid;
    const providerMessageId: string | undefined = data?.key?.id;
    if (!remoteJid || !providerMessageId) return;

    const phone = this.normalizePhone(remoteJid);
    const text: string | null =
      data?.message?.conversation ?? data?.message?.extendedTextMessage?.text ?? null;

    const contact = await this.prisma.contact.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    const conversation = await this.prisma.conversation.upsert({
      where: { contactId: contact.id },
      update: { lastMessageAt: new Date(), unreadCount: { increment: 1 } },
      create: { contactId: contact.id, lastMessageAt: new Date(), unreadCount: 1 },
    });

    await this.prisma.message.upsert({
      where: { providerMessageId },
      update: {},
      create: {
        conversationId: conversation.id,
        providerMessageId,
        direction: 'INBOUND',
        senderType: 'CUSTOMER',
        messageType: 'TEXT',
        content: text,
        status: 'DELIVERED',
      },
    });
  }

  private async handleOutboundAck(data: any) {
    const providerMessageId: string | undefined = data?.key?.id;
    if (!providerMessageId) return;

    const success = data?.success !== false;

    await this.prisma.message
      .update({
        where: { providerMessageId },
        data: { status: success ? 'SENT' : 'FAILED', sentAt: success ? new Date() : undefined },
      })
      .catch(() => {
        this.logger.debug(`No local message found for providerMessageId ${providerMessageId}`);
      });
  }

  private async handleStatusUpdate(data: any) {
    const providerMessageId: string | undefined = data?.key?.id ?? data?.id;
    const status: string | undefined = data?.status ?? data?.update?.status;
    if (!providerMessageId || !status) return;

    const patch: Record<string, any> = {};
    const normalized = status.toLowerCase();
    if (normalized === 'delivered') patch.deliveredAt = new Date();
    if (normalized === 'read') patch.readAt = new Date();
    if (['delivered', 'read'].includes(normalized)) {
      patch.status = normalized.toUpperCase();
    }
    if (Object.keys(patch).length === 0) return;

    await this.prisma.message.update({ where: { providerMessageId }, data: patch }).catch(() => {
      this.logger.debug(`No local message found for providerMessageId ${providerMessageId}`);
    });
  }

  private normalizePhone(remoteJid: string): string {
    const raw = remoteJid.split('@')[0];
    return raw.startsWith('+') ? raw : `+${raw}`;
  }
}