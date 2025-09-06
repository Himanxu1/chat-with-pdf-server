import type { MigrationInterface, QueryRunner } from 'typeorm'

export class NewMigration1757138175782 implements MigrationInterface {
  name = 'NewMigration1757138175782'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`usage\` (\`id\` varchar(36) NOT NULL, \`daily_count\` int NOT NULL DEFAULT '0', \`last_reset_day\` date NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`usage\` ADD CONSTRAINT \`FK_6338470db5681fc736739ca6954\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usage\` DROP FOREIGN KEY \`FK_6338470db5681fc736739ca6954\``,
    )
    await queryRunner.query(`DROP TABLE \`usage\``)
  }
}
