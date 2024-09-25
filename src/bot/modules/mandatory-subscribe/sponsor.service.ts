import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ArrayContains,
  FindManyOptions,
  FindOptionsWhere,
  IsNull,
  Or,
  Repository,
  UpdateResult,
} from 'typeorm';
import { CreateSponsorDto } from './dto/createSponsor.dto';
import { Sponsor } from './entity/sponsor.entity';
import { TelegramService } from './telegram.service';

@Injectable()
export class SponsorService {
  constructor(
    @InjectRepository(Sponsor)
    private readonly sponsorRepository: Repository<Sponsor>,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  async create(createSponsorDto: CreateSponsorDto): Promise<Sponsor> {
    const create = this.sponsorRepository.create(createSponsorDto);
    return await this.sponsorRepository.save(create);
  }

  async getSponsorById(
    id: number,
    withDeleted: boolean = false,
  ): Promise<Sponsor> {
    return await this.sponsorRepository.findOne({ where: { id }, withDeleted });
  }

  async getSponsors(
    { isActive, lang }: { isActive: boolean; lang?: string },
    page: number = 0,
    take: number = 10,
  ): Promise<Sponsor[]> {
    const where: FindManyOptions<Sponsor>['where'] = { isActive };
    if (lang) {
      where.langs = Or(ArrayContains([lang]), IsNull());
    }
    return await this.sponsorRepository.find({
      where,
      take,
      skip: page * take,
      order: { id: 'DESC' },
    });
  }

  // async getActive(): Promise<Sponsor[]> {
  //     return await this.sponsorRepository.find({
  //         isActive: true,
  //     });
  // }

  async findSponsors(find: FindManyOptions<Sponsor>): Promise<Sponsor[]> {
    return await this.sponsorRepository.find(find);
  }

  async update(
    where: FindOptionsWhere<Sponsor>,
    update: Partial<Sponsor>,
  ): Promise<UpdateResult> {
    return await this.sponsorRepository.update(where, update);
  }

  async remove(id: number): Promise<any> {
    return await this.sponsorRepository.softRemove({ id });
  }

  async restore(id: number): Promise<any> {
    return await this.sponsorRepository.restore({ id });
  }

  async setActive(id: number, active: boolean): Promise<boolean> {
    try {
      const sponsor = await this.getSponsorById(id);
      if (!sponsor.isActive) {
        const res = await this.telegramService.getChat(
          sponsor.token ?? this.configService.get('BOT_TOKEN'),
          sponsor.chat_id,
        );
        if (!res.id) {
          return false;
        }
      }
      await this.sponsorRepository.update({ id }, { isActive: active });
      return true;
    } catch (e) {
      return false;
    }
  }
}
