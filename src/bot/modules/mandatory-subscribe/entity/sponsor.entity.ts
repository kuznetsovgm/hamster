import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Sponsor {
  @PrimaryGeneratedColumn({ unsigned: true, type: 'int' })
  id: number;

  @Column({ nullable: false, type: 'bigint' })
  chat_id: number;

  @Column({ nullable: false, type: 'text' })
  link: string;

  @Column({ nullable: false, type: 'text' })
  manager: string;

  @Column({ nullable: true, type: 'text' })
  title: string;

  @Column({ nullable: false, type: 'boolean', default: false })
  is_bot?: boolean;

  @Column({ nullable: true, type: 'text' })
  token?: string;

  @Column({ nullable: true, type: 'text', array: true })
  langs?: string[];

  @Column({ nullable: true, type: 'text' })
  name: string;

  @Column({ nullable: false, type: 'boolean', default: false })
  isActive: boolean;

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
