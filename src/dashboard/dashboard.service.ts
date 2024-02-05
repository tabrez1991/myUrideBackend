import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SignUps } from '../models/signups.schema';
import { Model } from 'mongoose';
import { UserTrips } from '../models/usertrips.schema';
import { Profile } from '../models/profile.schema';
import { statesList } from '../enums/states';
import { BackgroundChecks } from '../models/backgroundchecks.schema';
import { UpdateDriverDto } from '../dto/updateDriver.dto';
import * as bcrypt from 'bcrypt';
import { DeleteDriverDTO } from '../dto/deleteDriver.dto';
import { Feedback } from '../models/feedback.schema';
import { DeactiveTripDTO } from 'src/dto/deactivateTrip.dto';
import { ObjectId } from 'mongodb';
import { AddDriverDto } from 'src/dto/addDriver.dto.';
import { Faqs } from 'src/models/faqs.schema';
import { Settings } from 'src/models/settings.schema';
import { AddQuestionFaqsDto } from 'src/dto/addQuestionFaq.dto';
import { UpdateQuestionFaqsDto } from 'src/dto/updateQuestionFaq.dto';
import { DeleteQuestionFaqsDto } from 'src/dto/deleteQuestionFaq.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(SignUps.name) private signupsModel: Model<SignUps>,
    @InjectModel(UserTrips.name) private userTripsModel: Model<UserTrips>,
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
    @InjectModel(BackgroundChecks.name) private backgroundChecksModel: Model<BackgroundChecks>,
    @InjectModel(Feedback.name) private feedbackModel: Model<Feedback>,
    @InjectModel(Faqs.name) private faqskModel: Model<Faqs>,
    @InjectModel(Settings.name) private settingsModel: Model<Settings>) { }

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
        .skip(skip)
        .limit(limit)
        .sort({ created_date: -1 })
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

      // Return the result with pagination metadata
      return {
        data: updatedUserProfiles,
        metadata: {
          page,
          pageSize: limit,
          total: totalDrivers,
          totalPages: Math.ceil(totalDrivers / limit),
        },
      };
      // return updatedUserProfiles;
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  async addDriver(AddDriverDto: AddDriverDto): Promise<any> {
    const { type, profile_picture, university_name, student_id, university_address, mobile, email, password, gender, destination_contact_number, gender_preferences, rider_preference, phone_code, phone_no, legal_first_name, legal_middle_name, legal_last_name, license_number, license_state, zip_code, dob, ssn, make, model, year, upload_vehicle_registration, upload_driver_licence, upload_inssurance_card, car_model, vehicle_license_plate_number } =
      AddDriverDto;
    let user = await this.signupsModel.findOne({ email });
    if (user) {
      throw new HttpException("driver already exists", HttpStatus.BAD_REQUEST);
    }

    const hashed = password ? await bcrypt.hash(password, 10) : user.password;

    const profilePicture = profile_picture ? profile_picture : "";

    const addSignupDetails = new this.signupsModel({
      email: email,
      username: email,
      password: hashed,
      device_id: "",
      device_token: "",
      device_type: "",
      email_verified: 0,
      jwttoken: "",
      otp: "",
      refreshToken: "",
      role_id: 1,
      status: 1
    })

    const addProfileDetails = new this.profileModel({
      profile_id: addSignupDetails._id,
      fullname: legal_first_name + ' ' + legal_middle_name + ' ' + legal_last_name,
      university_name: university_name,
      student_id: student_id,
      university_address: university_address,
      mobile_no: mobile,
      gender: gender,
      car_model: car_model,
      destination_contact_number: destination_contact_number,
      type: type,
      gender_preferences: gender_preferences,
      rider_preference: rider_preference,
      phone_code: phone_code,
      phone_no: phone_no,
      profile_photo: profilePicture,
      rating: "",
      make: make,
      model: car_model,
      year: year,
      upload_vehicle_registration: upload_vehicle_registration,
      upload_driver_licence: upload_driver_licence,
      upload_inssurance_card: upload_inssurance_card,
      vehicle_license_plate_number: vehicle_license_plate_number
    })

    const addBackgroundChecks = new this.backgroundChecksModel({
      driver_id: addSignupDetails._id,
      legal_first_name: legal_first_name,
      legal_middle_name: legal_middle_name,
      legal_last_name: legal_last_name,
      university_address: university_address,
      license_number: license_number,
      license_state: license_state,
      zip_code: zip_code,
      dob: dob,
      ssn: ssn,
      status: 1
    })

    await addSignupDetails.save();
    await addProfileDetails.save();
    await addBackgroundChecks.save();

    if (addSignupDetails && addProfileDetails && addBackgroundChecks) {
      return {
        msg: "Successfully added",
        statusCode: HttpStatus.OK
      };
    } else {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
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
        .sort({ created_date: -1 })
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

  async addRider(AddDriverDto: AddDriverDto): Promise<any> {
    const { type, profile_picture, university_name, student_id, university_address, mobile, email, password, gender, destination_contact_number, gender_preferences, rider_preference, phone_code, phone_no, legal_first_name, legal_middle_name, legal_last_name, license_number, license_state, zip_code, dob, ssn, make, model, year, upload_vehicle_registration, upload_driver_licence, upload_inssurance_card, car_model, vehicle_license_plate_number } =
      AddDriverDto;
    let user = await this.signupsModel.findOne({ email });
    if (user) {
      throw new HttpException("rider already exists", HttpStatus.BAD_REQUEST);
    }

    const hashed = password ? await bcrypt.hash(password, 10) : user.password;

    const profilePicture = profile_picture ? profile_picture : "";

    const addSignupDetails = new this.signupsModel({
      email: email,
      username: email,
      password: hashed,
      device_id: "",
      device_token: "",
      device_type: "",
      email_verified: 0,
      jwttoken: "",
      otp: "",
      refreshToken: "",
      role_id: 2,
      status: 1
    })

    const addProfileDetails = new this.profileModel({
      profile_id: addSignupDetails._id,
      fullname: legal_first_name + ' ' + legal_middle_name + ' ' + legal_last_name,
      university_name: university_name,
      student_id: student_id,
      university_address: university_address,
      mobile_no: mobile,
      gender: gender,
      car_model: car_model,
      destination_contact_number: destination_contact_number,
      type: type,
      gender_preferences: gender_preferences,
      rider_preference: rider_preference,
      phone_code: phone_code,
      phone_no: phone_no,
      profile_photo: profilePicture,
      rating: "",
      make, model, year, upload_vehicle_registration, upload_driver_licence, upload_inssurance_card, vehicle_license_plate_number
    })

    const addBackgroundChecks = new this.backgroundChecksModel({
      driver_id: addSignupDetails._id,
      legal_first_name: legal_first_name,
      legal_middle_name: legal_middle_name,
      legal_last_name: legal_last_name,
      university_address: university_address,
      license_number: license_number,
      license_state: license_state,
      zip_code: zip_code,
      dob: dob,
      ssn: ssn,
      status: 1
    })

    await addSignupDetails.save();
    await addProfileDetails.save();
    await addBackgroundChecks.save();

    if (addSignupDetails && addProfileDetails && addBackgroundChecks) {
      return {
        msg: "Successfully added",
        statusCode: HttpStatus.OK
      };
    } else {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
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

      const countQuery: any = {};

      if (searchQuery || state) {
        countQuery.$and = [];

        if (searchQuery) {
          countQuery.$and.push({
            $or: [
              { pickup_location: { $regex: new RegExp(searchQuery, 'i') } },
              { destination_location: { $regex: new RegExp(searchQuery, 'i') } },
              // { status: { $regex: new RegExp(searchQuery, 'i') } },
              // { _id: { $regex: new RegExp(searchQuery, 'i') } },
            ],
          });
        }

        if (state) {
          countQuery.$and.push({
            $or: [
              { pickup_location: { $regex: new RegExp(state, 'i') } },
              { destination_location: { $regex: new RegExp(state, 'i') } },
            ],
          });
        }
      }

      const totaltrips = await this.userTripsModel.countDocuments(countQuery);

      // Build the base query
      const trips = await this.userTripsModel
        .find(countQuery)
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

  async deactiveTrip(DeactiveTripDTO: DeactiveTripDTO): Promise<any> {
    const { tripId } = DeactiveTripDTO;
    console.log(tripId)
    let trip = await this.userTripsModel.findOne({ _id: tripId });
    if (!trip) {
      throw new HttpException('Trip doesnt exists', HttpStatus.BAD_REQUEST);
    }
    const updateTripDetails = await this.userTripsModel.updateOne(
      { _id: trip._id },
      {
        status: 4,
      },
    );
    if (updateTripDetails) {
      return {
        msg: "Successfully Deactivated",
        statusCode: HttpStatus.OK,
      };
    } else {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async activateTrip(DeactiveTripDTO: DeactiveTripDTO): Promise<any> {
    try {
      const { tripId } = DeactiveTripDTO;
      let trip = await this.userTripsModel.findOne({ _id: tripId });
      if (!trip) {
        throw new HttpException('Trip doesnt exists', HttpStatus.BAD_REQUEST);
      }

      const updateTripDetails = await this.userTripsModel.updateOne(
        { _id: trip._id },
        {
          status: 5,
        },
      );
      if (updateTripDetails) {
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

  async getFeedbackList(page = 1, limit = 10, searchQuery?: string): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const countQuery: any = {
        ...(searchQuery && {
          $or: [
            { fullname: { $regex: new RegExp(searchQuery, 'i') } },
            { mobile: { $regex: new RegExp(searchQuery, 'i') } },
            { description: { $regex: new RegExp(searchQuery, 'i') } },
            { email: { $regex: new RegExp(searchQuery, 'i') } },
          ],
        })
      };

      const totalFeedback = await this.feedbackModel.countDocuments(countQuery);

      // Build the base query
      const feedback = await this.feedbackModel
        .find(countQuery)
        .sort({ created_date: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      return {
        data: feedback,
        metadata: {
          page,
          pageSize: limit,
          total: totalFeedback,
          totalPages: Math.ceil(totalFeedback / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error counting feedback: ${error.message}`);
    }
  }

  // settings

  async getSettings(): Promise<any> {
    try {
      const settings = await this.settingsModel.find();
      return {
        data: settings,
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Privacy Policy
  async addPrivacyPolicy(privacy_policy: string): Promise<any> {
    try {
      const addPrivacyPolicy = new this.settingsModel({
        type: 'privacy_policy',
        privacy_policy: privacy_policy
      })
      await addPrivacyPolicy.save();
      if (addPrivacyPolicy) {
        return {
          msg: "Successfully added",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePrivacyPolicy(privacy_policy_id: string, privacy_policy: string): Promise<any> {
    try {
      const updatePrivacyPolicy = await this.settingsModel.updateOne(
        { _id: new ObjectId(privacy_policy_id) },
        {
          privacy_policy: privacy_policy
        })
      if (updatePrivacyPolicy) {
        return {
          msg: "Successfully updated",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deletePrivacyPolicy(privacy_policy_id: string): Promise<any> {
    try {
      const deletePrivacyPolicy = await this.settingsModel.deleteOne(
        { _id: new ObjectId(privacy_policy_id) })
      if (deletePrivacyPolicy) {
        return {
          msg: "Successfully deleted",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // User Agreement,
  async addUserAgreement(user_agreement: string): Promise<any> {
    try {
      const addUserAgreement = new this.settingsModel({
        type: 'user_agreement',
        user_agreement: user_agreement
      })
      await addUserAgreement.save();
      if (addUserAgreement) {
        return {
          msg: "Successfully added",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUserAgreement(user_agreement_id: string, user_agreement: string): Promise<any> {
    try {
      const updateUserAgreement = await this.settingsModel.updateOne(
        { _id: new ObjectId(user_agreement_id) },
        {
          user_agreement: user_agreement
        })
      if (updateUserAgreement) {
        return {
          msg: "Successfully updated",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteUserAgreement(user_agreement_id: string): Promise<any> {
    try {
      const deleteUserAgreement = await this.settingsModel.deleteOne(
        { _id: new ObjectId(user_agreement_id) })
      if (deleteUserAgreement) {
        return {
          msg: "Successfully deleted",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // User Guidelines,
  async addUserGuidelines(user_guidlines: string): Promise<any> {
    try {
      const addUserGuidelines = new this.settingsModel({
        type: 'user_guidlines',
        user_guidlines: user_guidlines
      })
      await addUserGuidelines.save();
      if (addUserGuidelines) {
        return {
          msg: "Successfully added",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUserGuidelines(user_guidlines_id: string, user_guidlines: string): Promise<any> {
    try {
      const updateUserGuidlines = await this.settingsModel.updateOne(
        { _id: new ObjectId(user_guidlines_id) },
        {
          user_guidlines: user_guidlines
        })
      if (updateUserGuidlines) {
        return {
          msg: "Successfully updated",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteUserGuidelines(user_guidlines_id: string): Promise<any> {
    try {
      const deleteUserGuildlines = await this.settingsModel.deleteOne(
        { _id: new ObjectId(user_guidlines_id) })
      if (deleteUserGuildlines) {
        return {
          msg: "Successfully deleted",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Drivers Agreements,
  async addDriversAgreements(driver_agreements: string): Promise<any> {
    try {
      const addDriversAgreements = new this.settingsModel({
        type: 'driver_agreements',
        driver_agreements: driver_agreements
      })
      await addDriversAgreements.save();
      if (addDriversAgreements) {
        return {
          msg: "Successfully added",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateDriversAgreements(driver_agreements_id: string, driver_agreements: string): Promise<any> {
    try {
      const updateDriversAgreements = await this.settingsModel.updateOne(
        { _id: new ObjectId(driver_agreements_id) },
        {
          driver_agreements: driver_agreements
        })
      if (updateDriversAgreements) {
        return {
          msg: "Successfully updated",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteDriversAgreements(driver_agreements_id: string): Promise<any> {
    try {
      const deleteDriversAgreements = await this.settingsModel.deleteOne(
        { _id: new ObjectId(driver_agreements_id) })
      if (deleteDriversAgreements) {
        return {
          msg: "Successfully deleted",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // FAQs
  async getFaqs(page = 1, limit = 10, searchQuery?: string): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const countQuery: any = {
        ...(searchQuery && {
          $or: [
            { question: { $regex: new RegExp(searchQuery, 'i') } },
            { category: { $regex: new RegExp(searchQuery, 'i') } },
          ],
        })
      };

      const totalFaqs = await this.faqskModel.countDocuments(countQuery);

      const faqs = await this.faqskModel
        .find(countQuery)
        .sort({ created_date: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      return {
        data: faqs,
        metadata: {
          page,
          pageSize: limit,
          total: totalFaqs,
          totalPages: Math.ceil(totalFaqs / limit),
        },
      };
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addFaq(AddQuestionFaqsDto: AddQuestionFaqsDto): Promise<any> {
    try {
      const { questions, answer, category } = AddQuestionFaqsDto;
      const addQuestonsFaqs = new this.faqskModel({
        queston: questions,
        answer: answer,
        category: category
      })
      await addQuestonsFaqs.save();
      if (addQuestonsFaqs) {
        return {
          msg: "Successfully added",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateFaqs(UpdateQuestionFaqsDto: UpdateQuestionFaqsDto): Promise<any> {
    try {
      const { id, questions, answer, category } = UpdateQuestionFaqsDto;
      const updateQuestonsFaqs = await this.faqskModel.updateOne(
        { _id: new ObjectId(id) },
        {
          queston: questions,
          answer: answer,
          category: category
        })
      if (updateQuestonsFaqs) {
        return {
          msg: "Successfully update",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteFaqs(DeleteQuestionFaqsDto: DeleteQuestionFaqsDto): Promise<any> {
    try {
      const { id } = DeleteQuestionFaqsDto;
      const deleteQuestonsFaqs = await this.faqskModel.deleteOne(
        { _id: new ObjectId(id) },
      )
      if (deleteQuestonsFaqs) {
        return {
          msg: "Successfully deleted",
          statusCode: HttpStatus.OK
        };
      } else {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
