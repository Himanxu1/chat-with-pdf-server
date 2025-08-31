import type { MigrationInterface, QueryRunner } from "typeorm";

export class NewMigration1756530395921 implements MigrationInterface {
  name = "NewMigration1756530395921";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`role\` enum ('user', 'assistant') NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`message\` DROP COLUMN \`role\``);
  }
}
