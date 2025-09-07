import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  type Relation,
} from 'typeorm'
import { User } from './user.js'
import { Plan } from './plan.js'

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, user => user.subscriptions)
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>

  @ManyToOne(() => Plan, plan => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<Plan>

  @Column({
    name: 'razorpay_subscription_id',
    type: 'varchar',
    unique: true,
    nullable: true,
  })
  razorpaySubscriptionId: string

  @Column({ name: 'status', type: 'varchar' })
  status: string
  // created, authenticated, active, paused, cancelled, expired

  @Column({ name: 'current_start', type: 'bigint', nullable: true })
  currentStart: number // epoch from Razorpay

  @Column({ name: 'current_end', type: 'bigint', nullable: true })
  currentEnd: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
