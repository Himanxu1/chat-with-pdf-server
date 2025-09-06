import type { MigrationInterface, QueryRunner } from 'typeorm'

export class NewMigration1757003346144 implements MigrationInterface {
  name = 'NewMigration1757003346144'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`plan\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`price\` int NOT NULL DEFAULT '0', \`interval\` varchar(255) NOT NULL DEFAULT 'monthly', \`razorpay_plan_id\` varchar(255) NULL, UNIQUE INDEX \`IDX_8aa73af67fa634d33de9bf874a\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`subscription\` (\`id\` varchar(36) NOT NULL, \`razorpay_subscription_id\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, \`current_start\` bigint NULL, \`current_end\` bigint NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NULL, \`plan_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_4d0c9d761b0b634863af448f0b\` (\`razorpay_subscription_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`subscription\` ADD CONSTRAINT \`FK_940d49a105d50bbd616be540013\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`subscription\` ADD CONSTRAINT \`FK_5fde988e5d9b9a522d70ebec27c\` FOREIGN KEY (\`plan_id\`) REFERENCES \`plan\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_5fde988e5d9b9a522d70ebec27c\``,
    )
    await queryRunner.query(
      `ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_940d49a105d50bbd616be540013\``,
    )
    await queryRunner.query(
      `DROP INDEX \`IDX_4d0c9d761b0b634863af448f0b\` ON \`subscription\``,
    )
    await queryRunner.query(`DROP TABLE \`subscription\``)
    await queryRunner.query(
      `DROP INDEX \`IDX_8aa73af67fa634d33de9bf874a\` ON \`plan\``,
    )
    await queryRunner.query(`DROP TABLE \`plan\``)
  }
}
