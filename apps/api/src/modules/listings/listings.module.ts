import { Module, forwardRef } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { AuthModule } from '../auth/auth.module';
import { DealersModule } from '../dealers/dealers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [AuthModule, DealersModule, forwardRef(() => NotificationsModule), SubscriptionsModule],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}

