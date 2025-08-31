import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  type Relation,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from "typeorm";
import { Chat } from "./chat.js";

@Entity()
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;

  @Column({
    name: "content",
    type: "text",
    nullable: false,
  })
  content: string;

  @Column({
    name: "role",
    type: "enum",
    enum: ["user", "assistant"],
    nullable: false,
  })
  role: "user" | "assistant";

  @Column({
    name: "chat_id",
    type: "varchar",
    nullable: false,
  })
  chatId: string;

  @ManyToOne(() => Chat, (chat) => chat.messages)
  @JoinColumn({ name: "chat_id", referencedColumnName: "id" })
  chat: Relation<Chat>;
}
