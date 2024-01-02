import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegisterDTO } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Payload } from 'src/types/payload';
import { LoginDTO } from 'src/dto/login.dto';
import { TokenUpdateDTO } from 'src/dto/tokenUpdate.dto';
import { ResetPasswordtDTO } from 'src/dto/resetPassword.dto';
import { UserDto } from 'src/dto/user.dto';
import { UpdateUserDto } from 'src/dto/updateUser.dto';
import { User } from 'src/models/user.schema';
import { DeleteUserDTO } from 'src/dto/deleteUser.dto';
import { UserStatus } from 'src/enums/userStatus.enum';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(RegisterDTO: RegisterDTO) {
    const { email } = RegisterDTO;
    const user = await this.userModel.findOne({ email });
    if (user) {
      throw new HttpException('user already exists', HttpStatus.BAD_REQUEST);
    }

    const createdUser = new this.userModel(RegisterDTO);

    await createdUser.save();
    return this.sanitizeUser(createdUser);
  }

  async findByPayload(payload: Payload) {
    const { email } = payload;
    const user = await this.userModel.findOne({
      email,
      status: UserStatus.ACTIVE,
    });
    return user;
  }

  async findByLogin(UserDTO: LoginDTO) {
    const { email, password } = UserDTO;
    const user = await this.userModel.findOne({
      email,
      status: UserStatus.ACTIVE,
    });
    if (!user) {
      throw new HttpException('user doesnt exists', HttpStatus.BAD_REQUEST);
    }
    if (await bcrypt.compare(password, user.password)) {
      return this.sanitizeUser(user);
    } else {
      throw new HttpException('invalid credential', HttpStatus.BAD_REQUEST);
    }
  }

  async updateToken(TokenUpdateDTO: TokenUpdateDTO) {
    const { email, token } = TokenUpdateDTO;
    let user = await this.userModel.findOne({
      email,
      status: UserStatus.ACTIVE,
    });
    if (!user) {
      throw new HttpException('user doesnt exists', HttpStatus.BAD_REQUEST);
    }
    const updateTokenDetails = await this.userModel.updateOne(
      { _id: user._id },
      { jwttoken: token, refreshToken: token, last_login: Date.now() },
    );
    if (updateTokenDetails) {
      user = await this.userModel.findOne({ email });
    }
    return user;
  }

  async resetPassword(ResetPasswordtDTO: ResetPasswordtDTO) {
    const { email, password } = ResetPasswordtDTO;
    let user = await this.userModel.findOne({
      email,
      status: UserStatus.ACTIVE,
    });
    if (!user) {
      throw new HttpException('user doesnt exists', HttpStatus.BAD_REQUEST);
    }

    const hashed = await bcrypt.hash(password, 10);

    const updatePassword = await this.userModel.updateOne(
      { _id: user._id },
      { jwttoken: null, refreshToken: null, password: hashed },
    );
    if (updatePassword) {
      user = await this.userModel.findOne({ email });
    }
    return this.sanitizeUser(user);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async getUsers(page = 1, limit = 10): Promise<UserDto[]> {
    const skip = (page - 1) * limit;

    const users = await this.userModel.find().skip(skip).limit(limit).exec();

    return users.map((user: User) => {
      const tempUser = user.toObject();
      delete tempUser['password'];
      tempUser['profile_picture'] = `/uploads/${user.profile_picture}`;
      return tempUser;
    });
  }

  async updateUser(UpdateUserDto: UpdateUserDto): Promise<User> {
    const { email, name, mobile, password, profile_picture, roles } =
      UpdateUserDto;
    let user = await this.userModel.findOne({ email });
    if (!user) {
      throw new HttpException('user doesnt exists', HttpStatus.BAD_REQUEST);
    }

    const hashed = password ? await bcrypt.hash(password, 10) : user.password;

    const updateUserDetails = await this.userModel.updateOne(
      { _id: user._id },
      {
        name: name,
        mobile: mobile,
        profile_picture: profile_picture,
        roles: roles,
        password: hashed,
      },
    );
    if (updateUserDetails) {
      user = await this.userModel.findOne({ email });
    }
    return this.sanitizeUser(user);
  }

  async deleteUser(DeleteUserDTO: DeleteUserDTO): Promise<User> {
    const { email } = DeleteUserDTO;
    let user = await this.userModel.findOne({ email });
    if (!user) {
      throw new HttpException('user doesnt exists', HttpStatus.BAD_REQUEST);
    }

    const updateUserDetails = await this.userModel.updateOne(
      { _id: user._id },
      {
        status: UserStatus.INACTIVE,
        jwttoken: null,
        refreshToken: null,
      },
    );
    if (updateUserDetails) {
      user = await this.userModel.findOne({ email });
    }
    return this.sanitizeUser(user);
  }

  sanitizeUser(user: User) {
    const sanitized = user.toObject();
    delete sanitized['password'];
    return sanitized;
  }
}
