exports.up = function (knex) {
  return knex.schema.createTable('rfqs', (table) => {
    table.string('id', 36).primary();
    table.string('title', 255).notNullable();
    table.enu('status', ['draft', 'sent', 'quoted', 'closed']).defaultTo('draft');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('status');
    table.index('created_at');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('rfqs');
};
