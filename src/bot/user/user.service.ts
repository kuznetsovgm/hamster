import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, UpdateResult } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateSessionDto } from './dto/update-user-session.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from 'src/entities/typeorm/user.entity';
import {
  NEED_NEW_REFERRALS_TO_GET_PROMO_CODE,
  NEED_NEW_REFERRALS_TO_GET_PROMO_CODE_FIRST_TIME,
  REFERRAL_PAYLOAD_STARTS_WITH,
} from './user.constants';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findOne(id: User['id']): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findMany(find: FindManyOptions<User>): Promise<any> {
    return await this.userRepository.find(find);
  }

  async getAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async count(find: FindManyOptions<User>): Promise<number> {
    const res = await this.userRepository.count(find);
    return res;
  }

  async usersList(): Promise<Pick<User, 'id'>[]> {
    return await this.findMany({
      select: ['id'],
      where: {
        started: true,
      },
      order: {
        created_at: 'ASC',
      },
    });
  }

  async create(user: CreateUserDto): Promise<User> {
    const check = await this.findOne(user.id);
    if (!!check) {
      throw new Error(`This user id:${user.id} already exist!`);
    }
    const newUser = this.userRepository.create(user);

    await this.userRepository.save(newUser);

    return newUser;
  }

  async update(updateUser: UpdateUserDto): Promise<User | null> {
    const { id, ...update } = updateUser;
    await this.userRepository.update({ id }, update);
    return this.findOne(updateUser.id);
  }

  // async updateSession(session: UpdateSessionDto): Promise<UpdateResult> {
  //   const { id, ...update } = session;
  //   return await this.userRepository.update({ id }, update);
  // }

  async deactivate(user: User): Promise<UpdateResult> {
    return await this.userRepository.update(
      { id: user.id },
      { started: false },
    );
  }

  async totalReferralsCount(userId: User['id']): Promise<number> {
    return await this.userRepository.count({
      where: {
        start_deep_link: `${REFERRAL_PAYLOAD_STARTS_WITH}${userId}`,
      },
    });
  }
  async getUserReferrals(userId: User['id']): Promise<[User[], number]> {
    return await this.userRepository.findAndCount({
      where: {
        start_deep_link: `${REFERRAL_PAYLOAD_STARTS_WITH}${userId}`,
      },
      order: { created_at: 'DESC' },
      take: 10,
    });
  }
  getNeedReferralsCount(user: User): number {
    return user.referralsCountSnapshot > 0
      ? NEED_NEW_REFERRALS_TO_GET_PROMO_CODE
      : NEED_NEW_REFERRALS_TO_GET_PROMO_CODE_FIRST_TIME;
  }

  async isPromoCodeAvailableByReferrals(user: User) {
    const currentRefCount = await this.totalReferralsCount(user.id);
    const needReferrals = this.getNeedReferralsCount(user);
    if (currentRefCount >= user.referralsCountSnapshot + needReferrals) {
      await this.userRepository.update(
        { id: user.id },
        { referralsCountSnapshot: currentRefCount },
      );
      return true;
    }
    return false;
  }
}
