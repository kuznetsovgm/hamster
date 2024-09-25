import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Hamster } from './hamster.entity';
import { Action } from 'src/hamster/hamster.interface';

@Entity()
export class HamsterLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int8',
    nullable: false,
  })
  hamsterId: number;
  @ManyToOne(() => Hamster, (h) => h.logs)
  @JoinColumn({ referencedColumnName: 'userId', name: 'hamsterId' })
  hamster: Hamster;

  @Column({ type: 'jsonb', nullable: false })
  action: Action;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP()' })
  createdAt: Date;
}
