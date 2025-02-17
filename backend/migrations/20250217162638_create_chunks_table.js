export function up(knex) {
    return knex.schema.createTable("chunks", (table) => {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table.text("name").notNullable();
      table.timestamps(true, true);
    });
  }
  
  export function down(knex) {
    return knex.schema.dropTableIfExists("chunks");
  }