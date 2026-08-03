import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  async getStatus() {
    return {
      whatsapp: {
        connected: false,
        session: null,
        phone: null,
      },
      n8n: {
        online: false,
      },
      activeAutomations: 0,
      humanTakeovers: 0,
      messagesToday: 0,
      failedAutomations: 0,
    };
  }
}