// ----------------------------------------
// File: backend/migrations/xxxxxx_add_columns_to_chunks.js
// ----------------------------------------
export function up(knex) {
    return knex.schema.alterTable("chunks", (table) => {
      table.string("status").defaultTo("pending");
      table.timestamp("started_at").nullable();
      table.timestamp("completed_at").nullable();
    });
  }
  
  export function down(knex) {
    return knex.schema.alterTable("chunks", (table) => {
      table.dropColumn("status");
      table.dropColumn("started_at");
      table.dropColumn("completed_at");
    });
  }