import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  type Relation,
} from "typeorm";
import { User } from "./user.js";
import { Message } from "./message.js";

@Entity()
export class Chat {
  @PrimaryGeneratedColumn("uuid")
  id: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;

  @Column({
    name: "thread_id",
    type: "varchar",
    length: 255,
    unique: true,
    nullable: false,
  })
  threadId: string;

  @Column({
    name: "user_id",
    type: "varchar",
    nullable: false,
  })
  userId: string;

  @ManyToOne(() => User, (user) => user.chats)
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: Relation<User>;

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];
}
