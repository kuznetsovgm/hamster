import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import {
  ClickerUser,
  HamsterSettings,
  PromoLoginClient,
} from 'src/hamster/hamster.interface';
import { HamsterLog } from './hamsterLog.entity';
import { DEFAULT_HAMSTER_SETTINGS } from 'src/hamster/hamster.constants';

@Entity()
export class Hamster {
  @Column({
    primary: true,
    type: 'int8',
    nullable: false,
  })
  userId: number;
  @ManyToOne(() => User, (u) => u.hamsters)
  @JoinColumn({ referencedColumnName: 'id', name: 'userId' })
  user: User;

  @Column({
    type: 'text',
    nullable: false,
    unique: true,
  })
  token: string;

  @Column({
    type: 'text',
    nullable: true,
    unique: true,
  })
  iframeSrc: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
  })
  isActive: boolean;

  @Column({
    nullable: true,
    type: 'jsonb',
    default: DEFAULT_HAMSTER_SETTINGS,
    transformer: {
      from: (v) => ({ ...DEFAULT_HAMSTER_SETTINGS, ...v }),
      to: (v) => ({ ...DEFAULT_HAMSTER_SETTINGS, ...v }),
    },
  })
  settings: HamsterSettings;

  @Column({
    nullable: true,
    type: 'jsonb',
  })
  clickerUser: ClickerUser;

  @Column({
    nullable: true,
    type: 'jsonb',
  })
  promoClientTokens: PromoLoginClient;

  @OneToMany(() => HamsterLog, (h) => h.hamster, {
    nullable: true,
    eager: false,
  })
  logs: HamsterLog[];

  @Column({
    type: 'timestamp',
    default: () => `(now() + interval '1 months')`,
  })
  payedUntil: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP()' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP()',
    onUpdate: 'CURRENT_TIMESTAMP()',
  })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
