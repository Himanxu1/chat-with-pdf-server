import type { MigrationInterface, QueryRunner } from 'typeorm'

export class NewMigration1757004187822 implements MigrationInterface {
  name = 'NewMigration1757004187822'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`webhook_event_log\` (\`id\` varchar(36) NOT NULL, \`event\` varchar(255) NOT NULL, \`payload\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`webhook_event_log\``)
  }
}
