import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SignUpsSchema } from '../models/signups.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserTripsSchema } from '../models/usertrips.schema';
import { ProfileSchema } from '../models/profile.schema';
import { BackgroundChecksSchema } from '../models/backgroundchecks.schema';
import { FeedbackSchema } from '../models/feedback.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SignUps', schema: SignUpsSchema },
      { name: 'UserTrips', schema: UserTripsSchema },
      { name: 'Profile', schema: ProfileSchema },
      { name: 'BackgroundChecks', schema: BackgroundChecksSchema },
      { name: 'Feedback', schema: FeedbackSchema },
    ]),
  ],
  controllers: [],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule { }
