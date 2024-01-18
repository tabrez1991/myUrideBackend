import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SignUps } from '../models/signups.schema';
import { Model } from 'mongoose';
import { UserTrips } from '../models/usertrips.schema';
import { Profile } from 'src/models/profile.schema';
import { statesList } from 'src/enums/states';
import { BackgroundChecks } from 'src/models/backgroundchecks.schema';
import { UpdateDriverDto } from 'src/dto/updateDriver.dto';
import * as bcrypt from 'bcrypt';
import { DeleteDriverDTO } from 'src/dto/deleteDriver.dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(SignUps.name) private signupsModel: Model<SignUps>,
    @InjectModel(UserTrips.name) private userTripsModel: Model<UserTrips>,
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
    @InjectModel(BackgroundChecks.name) private backgroundChecksModel: Model<BackgroundChecks>) { }

  async getSignups(page = 1, limit = 10, searchQuery?: string): Promise<any[]> {
    const skip = (page - 1) * limit;

    // Build the base query
    const query = this.signupsModel.find();

    // Apply search filter if provided
    if (searchQuery) {
      query.or([
        { name: { $regex: new RegExp(searchQuery, 'i') } },
        { email: { $regex: new RegExp(searchQuery, 'i') } },
        { mobileNumber: { $regex: new RegExp(searchQuery, 'i') } },
      ]);
    }

    // Apply pagination
    const users = await query.skip(skip).limit(limit).exec();

    return users.map((user: any) => {
      const tempUser = user.toObject();
      delete tempUser['password'];
      tempUser['profile_picture'] = `/uploads/${user.profile_picture}`;
      return tempUser;
    });
  }

  async getTotalData(): Promise<any> {
    try {
      const driverCount = await this.signupsModel.countDocuments({ role_id: 1 });
      const riderCount = await this.signupsModel.countDocuments({ role_id: 2 });
      const totalCount = await this.signupsModel.countDocuments({ $or: [{ role_id: 1 }, { role_id: 2 }] });
      const tripsCount = await this.userTripsModel.countDocuments();
      return {
        totalTrips: tripsCount,
        totalUser: totalCount,
        totalDrivers: driverCount,
        totalRiders: riderCount,
      };
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  async getUsersByMonths(): Promise<any> {
    try {
      const data = await this.signupsModel.find().exec();
      const monthYearCounts = data.reduce((acc, obj) => {
        const date = new Date(obj.created_date);
        const year = date.getFullYear();
        const month = date.toLocaleString('en-US', { month: 'short' });

        const key = `${month} ${year}`;
        acc[key] = (acc[key] || 0) + 1;

        return acc;
      }, {});

      const formattedMonthYearCounts = Object.entries(monthYearCounts).map(([key, count]) => {
        return {
          month: key,
          count,
        };
      });

      return formattedMonthYearCounts
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  async getPieChartsDetails(): Promise<any> {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      const totalUser = await this.signupsModel.countDocuments({ $or: [{ role_id: 1 }, { role_id: 2 }] });
      const currentMonth = await this.signupsModel.countDocuments({ created_date: { $gte: startOfMonth, $lte: endOfMonth } }).exec();
      const totalDrivers = await this.signupsModel.countDocuments({ role_id: 1 });
      const currentMonthD = await this.signupsModel.countDocuments({ $and: [{ role_id: 1 }, { created_date: { $gte: startOfMonth, $lte: endOfMonth } }] }).exec();
      const totalRiders = await this.signupsModel.countDocuments({ role_id: 2 });
      const currentMonthR = await this.signupsModel.countDocuments({ $and: [{ role_id: 2 }, { created_date: { $gte: startOfMonth, $lte: endOfMonth } }] }).exec();
      return {
        user: {
          total: totalUser,
          current: currentMonth
        },
        drivers: {
          total: totalDrivers,
          current: currentMonthD,
        },
        riders: {
          total: totalRiders,
          current: currentMonthR,
        }
      }
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  // async getDriversList(page = 1, limit = 10, searchQuery?: string): Promise<any> {
  //   try {
  //     const skip = (page - 1) * limit;

  //     const totalDrivers = await this.signupsModel.countDocuments({ role_id: 2 });

  //     // Build the base query
  //     const users = await this.signupsModel
  //       .find({
  //         role_id: 1, ...(searchQuery && {
  //           $or: [
  //             { username: { $regex: new RegExp(searchQuery, 'i') } },
  //             { email: { $regex: new RegExp(searchQuery, 'i') } },
  //           ],
  //         })
  //       })
  //       // .skip(skip)
  //       // .limit(limit)
  //       .exec();

  //     const backgroundChecksPromises = users.map((user) => {
  //       return this.backgroundChecksModel.findOne({ driver_id: user._id })
  //         .then(backgroundCheck => ({
  //           user,
  //           backgroundCheck,
  //         }));
  //     });

  //     const userProfilesWithBackground = await Promise.all(backgroundChecksPromises);

  //     const userProfilesPromises = users.map((user) => {
  //       return this.profileModel.findOne({ profile_id: user._id })
  //         .then(profile => ({
  //           user,
  //           profile,
  //         }));
  //     });

  //     const userProfilesWithProfile = await Promise.all(userProfilesPromises);


  //     const tripsDetailsPromises = userProfilesWithProfile.map(({ profile }) => {
  //       return this.userTripsModel.find({ user_id: profile.profile_id })
  //         .then(trips => ({
  //           profile,
  //           trips,
  //         }));
  //     });

  //     const tripsProfiles = await Promise.all(tripsDetailsPromises);

  //     const updatedUserProfiles = tripsProfiles.map(({ profile, trips }) => {
  //       return {
  //         ...profile.toObject(),
  //         totalTrips: trips.length,
  //         totalTripAmount: trips.reduce((total, trip) => total + trip.amount, 0),
  //       };
  //     });

  //     // return {
  //     //   data: updatedUserProfiles,
  //     //   metadata: {
  //     //     page,
  //     //     pageSize: limit,
  //     //     total: totalDrivers,
  //     //     totalPages: Math.ceil(totalDrivers / limit),
  //     //   },
  //     // };
  //     return updatedUserProfiles;
  //   } catch (error) {
  //     throw new Error(`Error counting users: ${error.message}`);
  //   }
  // }

  async getDriversList(page = 1, limit = 10, searchQuery?: string): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      // Count total drivers with role_id = 2
      const totalDrivers = await this.signupsModel.countDocuments({ role_id: 1 });

      // Build the base query for users with role_id = 1
      const users = await this.signupsModel
        .find({
          role_id: 1,
          // ...(searchQuery && {
          //   $or: [
          //     { username: { $regex: new RegExp(searchQuery, 'i') } },
          //     { email: { $regex: new RegExp(searchQuery, 'i') } },
          //   ],
          // }),
        })
        // .skip(skip)
        // .limit(limit)
        .exec();

      // Fetch background checks, user profiles, and trips in parallel
      const [backgroundChecks, userProfiles] = await Promise.all([
        Promise.all(users.map(user => this.backgroundChecksModel.findOne({ driver_id: user._id }))),
        Promise.all(users.map(user => this.profileModel.findOne({ profile_id: user._id }))),
        // Promise.all(users.map(user => this.userTripsModel.find({ user_id: user._id}))),
      ]);

      const tripsDetailsPromises = userProfiles.map(({ profile_id }) => {
        return this.userTripsModel.find({ user_id: profile_id })
          .then(trips => trips);
      });

      const tripsProfiles = await Promise.all(tripsDetailsPromises);

      // Combine user data with background checks, user profiles, and trips
      const updatedUserProfiles = users.map((user, index) => {
        const backgroundCheck = backgroundChecks[index];
        const profile = userProfiles[index];
        const trips = tripsProfiles[index];



        return {
          ...profile.toObject(),
          user,
          backgroundCheck,
          totalTrips: trips.length,
          totalTripAmount: trips.reduce((total, trip) => total + trip.amount, 0),
        };
      });

      // Return the result with pagination metadata
      // return {
      //   data: updatedUserProfiles,
      //   metadata: {
      //     page,
      //     pageSize: limit,
      //     total: totalDrivers,
      //     totalPages: Math.ceil(totalDrivers / limit),
      //   },
      // };
      if (searchQuery) {
        const searchQueryLowerCase = searchQuery.toLowerCase();

        const fullNameMatches = updatedUserProfiles.filter(user => {
          const fullName = user?.backgroundCheck?.legal_first_name + ' ' + user?.backgroundCheck?.legal_middle_name + ' ' + user?.backgroundCheck?.legal_last_name; // Assuming fullName is a property in your profile model
          return fullName && fullName.toLowerCase().includes(searchQueryLowerCase);
        });

        const mobileNumberMatches = updatedUserProfiles.filter(user => {
          const mobileNumber = user?.mobile_no;
          return mobileNumber && mobileNumber.toLowerCase().includes(searchQueryLowerCase);
        });

        return [...fullNameMatches, ...mobileNumberMatches];
      }

      return updatedUserProfiles;
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  async updateDriver(UpdateDriverDto: UpdateDriverDto): Promise<any> {
    const { email, name, middleName, lastName, mobile, password, profile_picture, roles } =
      UpdateDriverDto;
    let user = await this.signupsModel.findOne({ email });
    if (!user) {
      throw new HttpException("driver doesn't exists", HttpStatus.BAD_REQUEST);
    }

    const profile = await this.profileModel.findOne({ profile_id: user._id })

    const hashed = password ? await bcrypt.hash(password, 10) : user.password;

    const profilePicture = profile_picture ? profile_picture : profile.profile_photo;

    const updateSignUpDetails = await this.signupsModel.updateOne(
      { email: user.email },
      {
        email: email,
        password: hashed,
        role_id: Number(roles),
      },
    );

    const updateProfileDetails = await this.profileModel.updateOne(
      { profile_id: user._id },
      {
        fullname: name + " " + (middleName ? middleName + " " : "" + lastName ? lastName : ""),
        mobile_no: mobile,
        profile_photo: profilePicture,
        type: roles,
      },
    );

    const updateBackgroundDetails = await this.backgroundChecksModel.updateOne(
      { driver_id: user._id },
      {
        legal_first_name: name,
        legal_middle_name: middleName,
        legal_last_name: lastName,
      },
    );
    if (updateSignUpDetails && updateProfileDetails && updateBackgroundDetails) {
      return {
        msg: "Successfully updated",
        statusCode: HttpStatus.OK
      };
    } else {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteDriver(DeleteDriverDTO: DeleteDriverDTO): Promise<any> {
    const { email } = DeleteDriverDTO;
    let user = await this.signupsModel.findOne({ email });
    if (!user) {
      throw new HttpException('Driver doesnt exists', HttpStatus.BAD_REQUEST);
    }
    const updateSignUpDetails = await this.signupsModel.updateOne(
      { email: user.email },
      {
        status: 0,
      },
    );
    if (updateSignUpDetails) {
      return {
        msg: "Successfully Deactivated",
        statusCode: HttpStatus.OK,
      };
    } else {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async activateDriver(DeleteDriverDTO: DeleteDriverDTO): Promise<any> {
    try {
      const { email } = DeleteDriverDTO;
      let user = await this.signupsModel.findOne({ email });
      if (!user) {
        throw new HttpException('Driver doesnt exists', HttpStatus.BAD_REQUEST);
      }

      const updateSignUpDetails = await this.signupsModel.updateOne(
        { email: user.email },
        {
          status: 1,
        },
      );
      if (updateSignUpDetails) {
        return {
          msg: "Successfully Activated",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException(error.response, HttpStatus.BAD_REQUEST);
    }
  }

  async getRidersList(page = 1, limit = 10, searchQuery?: string): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const totalRiders = await this.profileModel.countDocuments();

      // Build the base query
      const users = await this.signupsModel
        .find({
          role_id: 2,
          // ...(searchQuery && {
          //   $or: [
          //     { username: { $regex: new RegExp(searchQuery, 'i') } },
          //     { email: { $regex: new RegExp(searchQuery, 'i') } },
          //   ],
          // })
        })
        // .skip(skip)
        // .limit(limit)
        .exec();

      // Fetch background checks, user profiles, and trips in parallel
      const [backgroundChecks, userProfiles] = await Promise.all([
        Promise.all(users.map(user => this.backgroundChecksModel.findOne({ driver_id: user._id }))),
        Promise.all(users.map(user => this.profileModel.findOne({ profile_id: user._id }))),
        // Promise.all(users.map(user => this.userTripsModel.find({ user_id: user._id}))),
      ]);

      const tripsDetailsPromises = userProfiles.map(({ profile_id }) => {
        return this.userTripsModel.find({ user_id: profile_id })
          .then(trips => trips);
      });

      const tripsProfiles = await Promise.all(tripsDetailsPromises);

      const updatedUserProfiles = users.map((user, index) => {
        const backgroundCheck = backgroundChecks[index];
        const profile = userProfiles[index];
        const trips = tripsProfiles[index];



        return {
          ...profile.toObject(),
          user,
          backgroundCheck,
          totalTrips: trips.length,
        };
      });

      // const userProfilesPromises = users.map((user) => {
      //   return this.profileModel.findOne({ profile_id: user._id })
      //     .then(profile => ({
      //       user,
      //       profile,
      //     }));
      // });

      // const userProfilesWithProfile = await Promise.all(userProfilesPromises);

      // const tripsDetailsPromises = userProfilesWithProfile.map(({ profile }) => {
      //   return this.userTripsModel.find({ user_id: profile.profile_id })
      //     .then(trips => ({
      //       profile,
      //       trips,
      //     }));
      // });

      // const tripsProfiles = await Promise.all(tripsDetailsPromises);

      // const updatedUserProfiles = tripsProfiles.map(({ profile, trips }) => {
      //   return {
      //     ...profile.toObject(),
      //     totalTrips: trips.length,
      //   };
      // });

      // return {
      //   data: updatedUserProfiles,
      //   metadata: {
      //     page,
      //     pageSize: limit,
      //     total: totalDrivers,
      //     totalPages: Math.ceil(totalDrivers / limit),
      //   },
      // };

      if (searchQuery) {
        const searchQueryLowerCase = searchQuery.toLowerCase();

        const fullNameMatches = updatedUserProfiles.filter(user => {
          // const fullName = user?.backgroundCheck?.legal_first_name + ' ' + user?.backgroundCheck?.legal_middle_name + ' ' + user?.backgroundCheck?.legal_last_name; // Assuming fullName is a property in your profile model
          const fullName = user?.fullname;
          return fullName && fullName.toLowerCase().includes(searchQueryLowerCase);
        });

        const mobileNumberMatches = updatedUserProfiles.filter(user => {
          const mobileNumber = user?.mobile_no;
          return mobileNumber && mobileNumber.toLowerCase().includes(searchQueryLowerCase);
        });

        return [...fullNameMatches, ...mobileNumberMatches];
      }
      
      return updatedUserProfiles;
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  async updateRider(UpdateDriverDto: UpdateDriverDto): Promise<any> {
    const { email, name, middleName, lastName, mobile, password, profile_picture, roles } =
      UpdateDriverDto;
    let user = await this.signupsModel.findOne({ email });
    if (!user) {
      throw new HttpException("driver doesn't exists", HttpStatus.BAD_REQUEST);
    }

    const profile = await this.profileModel.findOne({ profile_id: user._id })

    const hashed = password ? await bcrypt.hash(password, 10) : user.password;

    const profilePicture = profile_picture ? profile_picture : profile.profile_photo;

    const updateSignUpDetails = await this.signupsModel.updateOne(
      { email: user.email },
      {
        email: email,
        password: hashed,
        role_id: Number(roles),
      },
    );

    const updateProfileDetails = await this.profileModel.updateOne(
      { profile_id: user._id },
      {
        fullname: name + " " + (middleName ? middleName + " " : "" + lastName ? lastName : ""),
        mobile_no: mobile,
        profile_photo: profilePicture,
        type: roles,
      },
    );

    const updateBackgroundDetails = await this.backgroundChecksModel.updateOne(
      { driver_id: user._id },
      {
        legal_first_name: name,
        legal_middle_name: middleName,
        legal_last_name: lastName,
      },
    );
    if (updateSignUpDetails && updateProfileDetails && updateBackgroundDetails) {
      return {
        msg: "Successfully updated",
        statusCode: HttpStatus.OK
      };
    } else {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteRider(DeleteDriverDTO: DeleteDriverDTO): Promise<any> {
    const { email } = DeleteDriverDTO;
    let user = await this.signupsModel.findOne({ email });
    if (!user) {
      throw new HttpException('Driver doesnt exists', HttpStatus.BAD_REQUEST);
    }
    const updateSignUpDetails = await this.signupsModel.updateOne(
      { email: user.email },
      {
        status: 0,
      },
    );
    if (updateSignUpDetails) {
      return {
        msg: "Successfully Deactivated",
        statusCode: HttpStatus.OK,
      };
    } else {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async activateRider(DeleteDriverDTO: DeleteDriverDTO): Promise<any> {
    try {
      const { email } = DeleteDriverDTO;
      let user = await this.signupsModel.findOne({ email });
      if (!user) {
        throw new HttpException('Driver doesnt exists', HttpStatus.BAD_REQUEST);
      }

      const updateSignUpDetails = await this.signupsModel.updateOne(
        { email: user.email },
        {
          status: 1,
        },
      );
      if (updateSignUpDetails) {
        return {
          msg: "Successfully Activated",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException(error.response, HttpStatus.BAD_REQUEST);
    }
  }

  async getStateList(): Promise<any> {
    try {
      return statesList.sort((a, b) => a.state.localeCompare(b.state));
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  async getTripsList(page = 1, limit = 10, state?: string, searchQuery?: string): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const totaltrips = await this.userTripsModel.countDocuments();

      // Build the base query
      const trips = await this.userTripsModel
        .find({
          ...(searchQuery && {
            $or: [
              { pickup_location: { $regex: new RegExp(searchQuery, 'i') } },
              { destination_location: { $regex: new RegExp(searchQuery, 'i') } },
              { status: { $regex: new RegExp(searchQuery, 'i') } },
              { _id: { $regex: new RegExp(searchQuery, 'i') } },
            ],
          }),
          ...(state && {
            $or: [
              { pickup_location: { $regex: new RegExp(state, 'i') } },
              { destination_location: { $regex: new RegExp(state, 'i') } }
            ]
          })
        })
        .sort({ updated_date: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      return {
        data: trips,
        metadata: {
          page,
          pageSize: limit,
          total: totaltrips,
          totalPages: Math.ceil(totaltrips / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }
}
