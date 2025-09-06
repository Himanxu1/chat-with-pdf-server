import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Subscription } from './subscription.js'

@Entity()
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name: string // Free, Basic, Pro

  @Column({ name: 'price', type: 'int', default: 0 })
  price: number // in paise for consistency with Razorpay

  @Column({ name: 'interval', type: 'varchar', default: 'monthly' })
  interval: string // monthly, yearly, etc.

  @Column({ name: 'razorpay_plan_id', type: 'varchar', nullable: true })
  razorpayPlanId: string

  @OneToMany(() => Subscription, sub => sub.plan)
  subscriptions: Subscription[]
}
