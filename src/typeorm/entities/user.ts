import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number; // Non-null assertion

  @Column()
  firstName!: string; // Non-null assertion

  @Column()
  lastName!: string; // Non-null assertion

  @Column()
  isActive!: boolean; // Non-null assertion

  @Column()
  email!: string; // Non-null assertion
}
