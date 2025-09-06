import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm'
import { User } from './user.js'

@Entity()
export class Usage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'daily_count', type: 'int', default: 0 })
  dailyCount: number

  @Column({ name: 'last_reset_day', type: 'date', nullable: true })
  lastResetDay: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
