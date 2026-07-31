import { Module } from '@nestjs/common';
import { WasenderService } from './wasender.service';
import { WasenderWebhookController } from './wasender-webhook.controller';

@Module({
  controllers: [WasenderWebhookController],
  providers: [WasenderService],
  exports: [WasenderService],
})
export class WasenderModule {}
