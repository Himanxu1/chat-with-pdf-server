import type { MigrationInterface, QueryRunner } from "typeorm";

export class NewMigration1756232316283 implements MigrationInterface {
  name = "NewMigration1756232316283";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`deleted_at\` datetime(6) NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`deleted_at\` datetime(6) NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD \`deleted_at\` datetime(6) NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`deleted_at\``);
    await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`updated_at\``);
    await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`created_at\``);
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`deleted_at\``
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`updated_at\``
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`created_at\``
    );
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`deleted_at\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`updated_at\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`created_at\``);
  }
}
