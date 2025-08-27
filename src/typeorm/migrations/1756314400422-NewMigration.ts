import type { MigrationInterface, QueryRunner } from "typeorm";

export class NewMigration1756314400422 implements MigrationInterface {
  name = "NewMigration1756314400422";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`first_name\` varchar(255) NOT NULL, \`last_name\` varchar(255) NOT NULL, \` is_active\` tinyint NOT NULL DEFAULT 1, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_7a4fd2a547828e5efe420e50d1\` (\`first_name\`), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`chat\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`thread_id\` varchar(255) NOT NULL, \`user_id\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_2a32fb7e7a1fd831651101fedc\` (\`thread_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`message\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`content\` text NOT NULL, \`chat_id\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_15d83eb496fd7bec7368b30dbf3\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_859ffc7f95098efb4d84d50c632\` FOREIGN KEY (\`chat_id\`) REFERENCES \`chat\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_859ffc7f95098efb4d84d50c632\``
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_15d83eb496fd7bec7368b30dbf3\``
    );
    await queryRunner.query(`DROP TABLE \`message\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_2a32fb7e7a1fd831651101fedc\` ON \`chat\``
    );
    await queryRunner.query(`DROP TABLE \`chat\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_7a4fd2a547828e5efe420e50d1\` ON \`user\``
    );
    await queryRunner.query(`DROP TABLE \`user\``);
  }
}
