import type { MigrationInterface, QueryRunner } from "typeorm";

export class NewMigration1756232869420 implements MigrationInterface {
  name = "NewMigration1756232869420";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_619bc7b78eba833d2044153bacc\``
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_52af74c7484586ef4bdfd8e4dbb\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_58e4dbff0e1a32a9bdc861bb29\` ON \`user\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_df4b28226378b001f54263213f\` ON \`chat\``
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`chatId\` \`chat_id\` varchar(36) NULL`
    );
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`firstName\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`lastName\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`isActive\``);
    await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`threadId\``);
    await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`userId\``);
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`first_name\` varchar(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_7a4fd2a547828e5efe420e50d1\` (\`first_name\`)`
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`last_name\` varchar(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \` is_active\` tinyint NOT NULL DEFAULT 1`
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD \`thread_id\` varchar(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD UNIQUE INDEX \`IDX_2a32fb7e7a1fd831651101fedc\` (\`thread_id\`)`
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD \`user_id\` varchar(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`)`
    );
    await queryRunner.query(`ALTER TABLE \`message\` DROP COLUMN \`chat_id\``);
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`chat_id\` varchar(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_859ffc7f95098efb4d84d50c632\` FOREIGN KEY (\`chat_id\`) REFERENCES \`chat\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_15d83eb496fd7bec7368b30dbf3\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_15d83eb496fd7bec7368b30dbf3\``
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_859ffc7f95098efb4d84d50c632\``
    );
    await queryRunner.query(`ALTER TABLE \`message\` DROP COLUMN \`chat_id\``);
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`chat_id\` varchar(36) NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\``
    );
    await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`user_id\``);
    await queryRunner.query(
      `ALTER TABLE \`chat\` DROP INDEX \`IDX_2a32fb7e7a1fd831651101fedc\``
    );
    await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`thread_id\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \` is_active\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`last_name\``);
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP INDEX \`IDX_7a4fd2a547828e5efe420e50d1\``
    );
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`first_name\``);
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD \`userId\` varchar(36) NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD \`threadId\` varchar(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`isActive\` tinyint NOT NULL DEFAULT '1'`
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`lastName\` varchar(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`firstName\` varchar(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`chat_id\` \`chatId\` varchar(36) NULL`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_df4b28226378b001f54263213f\` ON \`chat\` (\`threadId\`)`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_58e4dbff0e1a32a9bdc861bb29\` ON \`user\` (\`firstName\`)`
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_52af74c7484586ef4bdfd8e4dbb\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_619bc7b78eba833d2044153bacc\` FOREIGN KEY (\`chatId\`) REFERENCES \`chat\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
