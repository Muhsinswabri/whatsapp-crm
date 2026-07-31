import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SenderType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface SendTextResult {
  msgId: string;
  jid: string;
  status: string;
}

@Injectable()
export class WasenderService {
  private readonly logger = new Logger(WasenderService.name);
  private readonly baseUrl = process.env.WASENDER_API_BASE_URL || 'https://www.wasenderapi.com/api';
  private readonly apiKey = process.env.WASENDER_API_KEY;

  constructor(private prisma: PrismaService) {}

  async sendText(to: string, text: string): Promise<SendTextResult> {
    if (!this.apiKey) {
      throw new Error('WASENDER_API_KEY is not configured');
    }

    const res = await fetch(`${this.baseUrl}/send-message`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, text }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.success) {
      this.logger.error(`WaSenderAPI send-message failed: ${res.status} ${JSON.stringify(body)}`);
      throw new Error(body?.message || `WaSenderAPI request failed with status ${res.status}`);
    }

    return {
      msgId: String(body.data.msgId),
      jid: body.data.jid,
      status: body.data.status,
    };
  }

  async sendTextAndLog(contactId: string, text: string, senderType: SenderType = 'HUMAN') {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const result = await this.sendText(contact.phone, text);

    const conversation = await this.prisma.conversation.upsert({
      where: { contactId },
      update: { lastMessageAt: new Date() },
      create: { contactId, lastMessageAt: new Date() },
    });

    return this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        providerMessageId: result.msgId,
        direction: 'OUTBOUND',
        senderType,
        messageType: 'TEXT',
        content: text,
        status: 'PENDING',
      },
    });
  }
}