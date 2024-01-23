import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SignUpsSchema } from 'src/models/signups.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserTripsSchema } from 'src/models/usertrips.schema';
import { ProfileSchema } from 'src/models/profile.schema';
import { BackgroundChecksSchema } from 'src/models/backgroundchecks.schema';
import { FeedbackSchema } from 'src/models/feedback.schema';

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
