import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity()
@Index('subscribe_chat_id__user_id__updated_at', ['chat_id', 'user_id', 'updated_at'])
@Index('subscribe_user_id', ['user_id'])
export class Subscribe {

    @PrimaryColumn({type: 'bigint'})
    chat_id: number;

    @PrimaryColumn({unsigned: true, type: 'bigint'})
    user_id: number;

    // @Column({type: 'boolean', default: true})
    // check: boolean;

    // @Column({type: 'datetime', nullable: false, default: () => "CURRENT_TIMESTAMP()"})
    // check_date: Date;

    @CreateDateColumn({type: "timestamp", default: () => "CURRENT_TIMESTAMP()"})
    created_at: Date;

    @UpdateDateColumn({type: "timestamp", default: () => "CURRENT_TIMESTAMP()", onUpdate: "CURRENT_TIMESTAMP()"})
    updated_at: Date;

}
