import sequelize from "../config/database";

/**
 * Drops ALL duplicate/extra foreign keys from every table,
 * keeping only the one with the lowest numeric suffix per (table, column) pair.
 */
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.query("SET FOREIGN_KEY_CHECKS=0");

    const [fks] = await sequelize.query(`
      SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME
    `) as [Array<{ TABLE_NAME: string; CONSTRAINT_NAME: string; COLUMN_NAME: string }>, unknown];

    // Group by table+column, keep first (alphabetically lowest = original), drop the rest
    const seen = new Map<string, string>();
    const toDrop: Array<{ table: string; name: string }> = [];

    for (const fk of fks) {
      const key = `${fk.TABLE_NAME}.${fk.COLUMN_NAME}`;
      if (seen.has(key)) {
        toDrop.push({ table: fk.TABLE_NAME, name: fk.CONSTRAINT_NAME });
      } else {
        seen.set(key, fk.CONSTRAINT_NAME);
      }
    }

    if (toDrop.length === 0) {
      console.log("No duplicate FKs found.");
    } else {
      console.log(`Dropping ${toDrop.length} duplicate FK(s)...`);
      for (const { table, name } of toDrop) {
        await sequelize.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${name}\``);
        console.log(`  Dropped: ${table}.${name}`);
      }
    }

    await sequelize.query("SET FOREIGN_KEY_CHECKS=1");
    console.log("Done.");
    await sequelize.close();
  } catch (err: any) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
})();
