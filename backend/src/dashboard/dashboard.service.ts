import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DashboardService {
  async getStatus() {
    const { data } = await axios.get(
      `https://www.wasenderapi.com/api/whatsapp-sessions/${process.env.WASENDER_SESSION_ID}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WASENDER_API_TOKEN}`,
          Accept: 'application/json',
        },
      },
    );

    const session = data.data;

    return {
      whatsapp: {
        connected: session.status === 'connected',
        session: session.name,
        phone: session.phone_number,
      },
      n8n: {
        online: true,
      },
      activeAutomations: 0,
      humanTakeovers: 0,
      messagesToday: 0,
      failedAutomations: 0,
    };
  }
}