exports.up = function (knex) {
  return knex.schema.createTable('webhooks', (table) => {
    table.string('id', 36).primary();
    table.string('name', 255);
    table.string('url', 500).notNullable();
    table.text('events'); // JSON array
    table.string('api_key_hash', 64);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('api_key_hash');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('webhooks');
};
