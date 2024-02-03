import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { RegisterDTO } from '../dto/register.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LoginDTO } from '../dto/login.dto';
import { ResetPasswordtDTO } from '../dto/resetPassword.dto';
import { UserDto } from '../dto/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from '../dto/updateUser.dto';
import { User } from '../models/user.schema';
import { DeleteUserDTO } from '../dto/deleteUser.dto';
import { Roles } from '../decorator/roles.decorator';
import { UserRole } from '../enums/roles.enum';
import { RoleGuard } from './role.guard';
import { LogoutUserDTO } from '../dto/logoutUser.dto';
import { DashboardService } from '../dashboard/dashboard.service';
import { UpdateDriverDto } from '../dto/updateDriver.dto';
import { DeleteDriverDTO } from '../dto/deleteDriver.dto';
import { DeactiveTripDTO } from 'src/dto/deactivateTrip.dto';
import { AddUserDto } from 'src/dto/addUser.dto';
import { AddDriverDto } from 'src/dto/addDriver.dto.';

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) { }

  @Get('/total')
  async totalData(): Promise<any> {
    const total = await this.dashboardService.getTotalData();
    return total;
  }

  @Get('/month-wise')
  async monthWise(): Promise<any> {
    const total = await this.dashboardService.getUsersByMonths();
    return total;
  }

  @Get('/month-growth')
  async monthWiseGrowth(): Promise<any> {
    const total = await this.dashboardService.getPieChartsDetails();
    return total;
  }

  @Get('/drivers-list')
  async driverDetails(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('searchQuery') searchQuery: string,
  ): Promise<any[]> {
    return this.dashboardService.getDriversList(page, limit, searchQuery);
  }

  @Post('/add-driver')
  @UseInterceptors(
    FileInterceptor('profile_picture'),
    FileInterceptor('upload_vehicle_registration'),
    FileInterceptor('upload_driver_licence'),
    FileInterceptor('upload_inssurance_card'))
  async addDriver(
    @UploadedFile() file: any,
    @Body() AddDriverDto: AddDriverDto,
  ) {
    AddDriverDto.profile_picture = file ? file.filename : null;
    AddDriverDto.upload_vehicle_registration = file ? file.filename : null;
    AddDriverDto.upload_driver_licence = file ? file.filename : null;
    AddDriverDto.upload_inssurance_card = file ? file.filename : null;
    return this.dashboardService.addDriver(AddDriverDto);
  }

  @Post('/edit-driver')
  @UseInterceptors(FileInterceptor('profile_picture'))
  async createDriver(
    @UploadedFile() file: any,
    @Body() UpdateDriverDto: UpdateDriverDto,
  ) {
    UpdateDriverDto.profile_picture = file ? file.filename : null;
    return this.dashboardService.updateDriver(UpdateDriverDto);
  }

  @Post('/delete-driver')
  async deleteDriver(@Body() DeleteDriverDTO: DeleteDriverDTO) {
    return await this.dashboardService.deleteDriver(DeleteDriverDTO);
  }

  @Post('/activate-driver')
  async activateDriver(@Body() DeleteDriverDTO: DeleteDriverDTO) {
    return await this.dashboardService.activateDriver(DeleteDriverDTO);
  }

  @Get('/riders-list')
  async riderDetails(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('searchQuery') searchQuery: string,
  ): Promise<any[]> {
    return this.dashboardService.getRidersList(page, limit, searchQuery);
  }

  @Post('/add-rider')
  @UseInterceptors(
    FileInterceptor('profile_picture'),
    FileInterceptor('upload_vehicle_registration'),
    FileInterceptor('upload_driver_licence'),
    FileInterceptor('upload_inssurance_card'))
  async addRider(
    @UploadedFile() file: any,
    @Body() AddDriverDto: AddDriverDto,
  ) {
    AddDriverDto.profile_picture = file ? file.filename : null;
    AddDriverDto.upload_vehicle_registration = file ? file.filename : null;
    AddDriverDto.upload_driver_licence = file ? file.filename : null;
    AddDriverDto.upload_inssurance_card = file ? file.filename : null;
    return this.dashboardService.addRider(AddDriverDto);
  }

  @Post('/edit-rider')
  @UseInterceptors(FileInterceptor('profile_picture'))
  async createRider(
    @UploadedFile() file: any,
    @Body() UpdateDriverDto: UpdateDriverDto,
  ) {
    UpdateDriverDto.profile_picture = file ? file.filename : null;
    return this.dashboardService.updateRider(UpdateDriverDto);
  }

  @Post('/delete-rider')
  async deleteRider(@Body() DeleteDriverDTO: DeleteDriverDTO) {
    return await this.dashboardService.deleteRider(DeleteDriverDTO);
  }

  @Post('/activate-rider')
  async activateRider(@Body() DeleteDriverDTO: DeleteDriverDTO) {
    return await this.dashboardService.activateRider(DeleteDriverDTO);
  }

  @Get('/states-list')
  async statesDetails(): Promise<any[]> {
    return this.dashboardService.getStateList();
  }

  @Get('/trips-list')
  async tripsDetails(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('state') state: string,
    @Query('searchQuery') searchQuery: string,
  ): Promise<any[]> {
    return this.dashboardService.getTripsList(page, limit, state, searchQuery);
  }

  @Post('/deactivate-trip')
  async deactivateTrip(@Body() DeactiveTripDTO: DeactiveTripDTO) {
    return await this.dashboardService.deactiveTrip(DeactiveTripDTO);
  }

  @Post('/activate-trip')
  async activateTrip(@Body() DeactiveTripDTO: DeactiveTripDTO) {
    return await this.dashboardService.activateTrip(DeactiveTripDTO);
  }

  @Get('/feedback-list')
  async feedbackDetails(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('searchQuery') searchQuery: string,
  ): Promise<any[]> {
    return this.dashboardService.getFeedbackList(page, limit, searchQuery);
  }


  @Post('register')
  async register(@Body() registerDTO: RegisterDTO) {
    const user = await this.userService.create(registerDTO);
    return {
      msg: 'User successfully registered',
      userId: user._id,
      userName: user.name,
    };
  }

  @Post('login')
  async login(@Body() loginDTO: LoginDTO) {
    const user = await this.userService.findByLogin(loginDTO);
    const payload = {
      email: user.email,
      name: user.name,
      roles: user.roles,
      status: user.status,
    };
    const token = await this.authService.signPayload(payload);
    const updateUserDetails = await this.userService.updateToken({
      email: user.email,
      token: token,
    });
    return updateUserDetails;
  }

  @Post('reset-password')
  async resetPassword(@Body() ResetPasswordtDTO: ResetPasswordtDTO) {
    const user = await this.userService.resetPassword(ResetPasswordtDTO);
    return {
      msg: 'reset password successfully',
      userId: user._id,
      userName: user.name,
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  async getUserById(@Param('id') id: string): Promise<User> {
    const user = await this.userService.getUserById(id);
    return user;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  async getUsers(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('searchQuery') searchQuery: string,
  ): Promise<UserDto[]> {
    return this.userService.getUsers(page, limit, searchQuery);
  }

  @Post('/add-user')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @UseInterceptors(FileInterceptor('profile_picture'))
  async addUser(
    @UploadedFile() file: any,
    @Body() AddUserDto: AddUserDto,
  ) {
    AddUserDto.profile_picture = file ? file.filename : null;
    return this.userService.addUser(AddUserDto);
  }

  @Post('/edit-user')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @UseInterceptors(FileInterceptor('profile_picture'))
  async createUser(
    @UploadedFile() file: any,
    @Body() UpdateUserDto: UpdateUserDto,
  ) {
    UpdateUserDto.profile_picture = file ? file.filename : null;
    return this.userService.updateUser(UpdateUserDto);
  }

  @Post('/delete-user')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  async deleteUser(@Body() DeleteUserDTO: DeleteUserDTO) {
    const user = await this.userService.deleteUser(DeleteUserDTO);
    return {
      msg: 'User successfully deleted',
      userId: user._id,
      userName: user.name,
    };
  }

  @Post('/activate-user')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  async activateUser(@Body() DeleteUserDTO: DeleteUserDTO) {
    const user = await this.userService.activateUser(DeleteUserDTO);
    return {
      msg: 'User successfully activated',
      userId: user._id,
      userName: user.name,
    };
  }

  @Post('/logout')
  @UseGuards(AuthGuard('jwt'))
  async logoutMethod(@Body() LogoutUserDTO: LogoutUserDTO) {
    const user = await this.userService.logoutUser(LogoutUserDTO);
    return {
      msg: 'User successfully logout',
      userId: user._id,
      userName: user.name,
    };
  }
}
