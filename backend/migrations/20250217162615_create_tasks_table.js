export function up(knex) {
    return knex.schema.createTable("tasks", (table) => {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table.text("title").notNullable();
      table.text("description").defaultTo("");
      table.enu("schedule", ["today", "tomorrow"]).notNullable();
      table.enu("status", ["pending", "completed"]).defaultTo("pending");
      table.uuid("chunk_id").nullable(); // Removed foreign key constraint
      table.timestamps(true, true);
    });
  }
  
  export function down(knex) {
    return knex.schema.dropTableIfExists("tasks");
  }