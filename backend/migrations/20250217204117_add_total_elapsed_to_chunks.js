// backend/migrations/202502XX_add_total_elapsed_to_chunks.js
export function up(knex) {
    return knex.schema.alterTable("chunks", (table) => {
      // Adds an integer column for total elapsed time (in seconds)
      table.integer("total_elapsed").defaultTo(0);
    });
  }
  
  export function down(knex) {
    return knex.schema.alterTable("chunks", (table) => {
      table.dropColumn("total_elapsed");
    });
  }