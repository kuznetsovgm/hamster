import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from 'src/bot/user/user.interface';
import { Hamster } from './hamster.entity';

@Entity()
export class User {
  @Column({
    primary: true,
    nullable: false,
    unique: true,
    unsigned: true,
    type: 'int8',
  })
  id: number;

  @Column({
    nullable: false,
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true, type: 'text' })
  first_name: string;

  @Column({ nullable: true, type: 'text' })
  last_name: string;

  @Column({ nullable: true, type: 'text' })
  username: string;

  @Column({ nullable: false, type: 'boolean', default: false })
  started: boolean;

  @Column({ nullable: false, type: 'text', default: 'ru' })
  lang: string = 'ru';

  @Column({ nullable: true, type: 'int', unsigned: true })
  last_message_id: number;

  @OneToMany(() => Hamster, (h) => h.userId, { nullable: true, eager: false })
  hamsters: Hamster[];

  @Column({ nullable: true, type: 'text' })
  start_deep_link: string;

  @Column({ nullable: true, type: 'int4', default: 0 })
  referralsCountSnapshot: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP()' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP()',
    onUpdate: 'CURRENT_TIMESTAMP()',
  })
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
