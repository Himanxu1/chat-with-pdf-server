import type { MigrationInterface, QueryRunner } from 'typeorm'

export class NewMigration1757417171650 implements MigrationInterface {
  name = 'NewMigration1757417171650'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`message\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`content\` text NOT NULL, \`role\` enum ('user', 'assistant') NOT NULL, \`chat_id\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`chat\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`thread_id\` varchar(255) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`pdf_id\` varchar(255) NULL, UNIQUE INDEX \`IDX_2a32fb7e7a1fd831651101fedc\` (\`thread_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`plan\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`price\` int NOT NULL DEFAULT '0', \`interval\` varchar(255) NOT NULL DEFAULT 'monthly', \`razorpay_plan_id\` varchar(255) NULL, \`daily_pdf_limit\` int NOT NULL DEFAULT '0', \`monthly_pdf_limit\` int NOT NULL DEFAULT '0', \`max_file_size_mb\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_8aa73af67fa634d33de9bf874a\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`subscription\` (\`id\` varchar(36) NOT NULL, \`razorpay_subscription_id\` varchar(255) NULL, \`status\` varchar(255) NOT NULL, \`current_start\` bigint NULL, \`current_end\` bigint NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NULL, \`plan_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_4d0c9d761b0b634863af448f0b\` (\`razorpay_subscription_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`first_name\` varchar(255) NOT NULL, \`last_name\` varchar(255) NULL, \` is_active\` tinyint NOT NULL DEFAULT 1, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_7a4fd2a547828e5efe420e50d1\` (\`first_name\`), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`webhook_event_log\` (\`id\` varchar(36) NOT NULL, \`event\` varchar(255) NOT NULL, \`payload\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`usage\` (\`id\` varchar(36) NOT NULL, \`daily_count\` int NOT NULL DEFAULT '0', \`monthly_count\` int NOT NULL DEFAULT '0', \`last_reset_day\` date NULL, \`last_reset_month\` date NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_859ffc7f95098efb4d84d50c632\` FOREIGN KEY (\`chat_id\`) REFERENCES \`chat\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_15d83eb496fd7bec7368b30dbf3\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`subscription\` ADD CONSTRAINT \`FK_940d49a105d50bbd616be540013\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`subscription\` ADD CONSTRAINT \`FK_5fde988e5d9b9a522d70ebec27c\` FOREIGN KEY (\`plan_id\`) REFERENCES \`plan\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`usage\` ADD CONSTRAINT \`FK_6338470db5681fc736739ca6954\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usage\` DROP FOREIGN KEY \`FK_6338470db5681fc736739ca6954\``,
    )
    await queryRunner.query(
      `ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_5fde988e5d9b9a522d70ebec27c\``,
    )
    await queryRunner.query(
      `ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_940d49a105d50bbd616be540013\``,
    )
    await queryRunner.query(
      `ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_15d83eb496fd7bec7368b30dbf3\``,
    )
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_859ffc7f95098efb4d84d50c632\``,
    )
    await queryRunner.query(`DROP TABLE \`usage\``)
    await queryRunner.query(`DROP TABLE \`webhook_event_log\``)
    await queryRunner.query(
      `DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``,
    )
    await queryRunner.query(
      `DROP INDEX \`IDX_7a4fd2a547828e5efe420e50d1\` ON \`user\``,
    )
    await queryRunner.query(`DROP TABLE \`user\``)
    await queryRunner.query(
      `DROP INDEX \`IDX_4d0c9d761b0b634863af448f0b\` ON \`subscription\``,
    )
    await queryRunner.query(`DROP TABLE \`subscription\``)
    await queryRunner.query(
      `DROP INDEX \`IDX_8aa73af67fa634d33de9bf874a\` ON \`plan\``,
    )
    await queryRunner.query(`DROP TABLE \`plan\``)
    await queryRunner.query(
      `DROP INDEX \`IDX_2a32fb7e7a1fd831651101fedc\` ON \`chat\``,
    )
    await queryRunner.query(`DROP TABLE \`chat\``)
    await queryRunner.query(`DROP TABLE \`message\``)
  }
}
