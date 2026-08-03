import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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

  private readonly baseUrl =
    process.env.WASENDER_API_BASE_URL ||
    'https://www.wasenderapi.com/api';

  private readonly apiKey = process.env.WASENDER_API_KEY;

  constructor(private readonly prisma: PrismaService) {}

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getSessionStatus() {
    if (!this.apiKey) {
      throw new Error('WASENDER_API_KEY is not configured');
    }

    const res = await fetch(`${this.baseUrl}/sessions`, {
      method: 'GET',
      headers: this.headers,
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      this.logger.error(JSON.stringify(body));
      throw new Error(
        body?.message || `WaSender API returned ${res.status}`,
      );
    }

    return body;
  }

  async sendText(
    to: string,
    text: string,
  ): Promise<SendTextResult> {
    if (!this.apiKey) {
      throw new Error('WASENDER_API_KEY is not configured');
    }

    const res = await fetch(
      `${this.baseUrl}/send-message`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          to,
          text,
        }),
      },
    );

    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.success) {
      this.logger.error(JSON.stringify(body));

      throw new Error(
        body?.message ||
          `WaSender request failed (${res.status})`,
      );
    }

    return {
      msgId: String(body.data.msgId),
      jid: body.data.jid,
      status: body.data.status,
    };
  }

  async sendTextAndLog(
    contactId: string,
    text: string,
    senderType: SenderType = 'HUMAN',
  ) {
    const contact = await this.prisma.contact.findUnique({
      where: {
        id: contactId,
      },
    });

    if (!contact) {
      throw new NotFoundException(
        'Contact not found',
      );
    }

    const result = await this.sendText(
      contact.phone,
      text,
    );

    const conversation =
      await this.prisma.conversation.upsert({
        where: {
          contactId,
        },
        update: {
          lastMessageAt: new Date(),
        },
        create: {
          contactId,
          lastMessageAt: new Date(),
        },
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