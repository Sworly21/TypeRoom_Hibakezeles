import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Render,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import { RegisterDto } from './register.dto';
import User from './user.entity';
import * as bcrypt from 'bcrypt';
import { ChangeUserDto } from './changeUser.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private dataSource: DataSource,
  ) {}

  @Get()
  @Render('index')
  index() {
    return { message: 'Welcome to the homepage' };
  }

  @Post('/register')
  @HttpCode(200)
  async register(@Body() registerDto: RegisterDto) {
    if (
      !registerDto.email ||
      registerDto.password ||
      registerDto.passwordAgain
    ) {
      throw new BadRequestException('All fields are required!');
    }
    if (!registerDto.email.includes('@')) {
      throw new BadRequestException('Email must contain a @ character!');
    }
    if (registerDto.password !== registerDto.passwordAgain) {
      throw new BadRequestException('The two password must match!');
    }
    if (registerDto.password.length < 8) {
      throw new BadRequestException(
        'The password must be at least 8 character long!',
      );
    }

    const userRepo = this.dataSource.getRepository(User);
    const user = new User();
    user.email = registerDto.email;
    user.password = await bcrypt.hash(registerDto.password, 15);
    await userRepo.save(user);

    delete user.password;

    return user;
  }

  @Patch('/user/:id')
  async changeUser(
    @Param('id') id: number,
    @Body() changeUserDto: ChangeUserDto,
  ) {
    if (!changeUserDto.email.includes('@')) {
      throw new BadRequestException('Email must contain a @ character!');
    }
    if (
      !changeUserDto.profilePicture.startsWith('http://') ||
      !changeUserDto.profilePicture.startsWith('https://')
    ) {
      throw new BadRequestException(
        'Profile picture URL must follow the format',
      );
    }
    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: id });
    user.email = changeUserDto.email;
    user.profilePictureUrl = changeUserDto.profilePicture;
    await userRepo.save(user);

    return user;
  }
}
