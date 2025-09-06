import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm'
import { Chat } from './chat.js'
import { Subscription } from './subscription.js'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false,
  })
  firstName: string

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 255,
  })
  lastName: string

  @Column({
    name: ' is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false,
  })
  email: string

  @Column({
    name: 'password',
    type: 'varchar',
    nullable: false,
  })
  password: string

  @OneToMany(() => Chat, chat => chat.user)
  chats: Chat[]

  @OneToMany(() => Subscription, sub => sub.user)
  subscriptions: Subscription[]
}
