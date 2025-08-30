import type { MigrationInterface, QueryRunner } from "typeorm";

export class NewMigration1756401185141 implements MigrationInterface {
  name = "NewMigration1756401185141";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD \`pdf_id\` varchar(255) NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`pdf_id\``);
  }
}
