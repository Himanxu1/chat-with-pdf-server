import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export class WebhookEventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  event: string

  @Column({ type: 'text' })
  payload: any

  @CreateDateColumn()
  createdAt: Date
}
