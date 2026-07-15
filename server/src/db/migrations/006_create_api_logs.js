exports.up = function (knex) {
  return knex.schema.createTable('api_logs', (table) => {
    table.string('id', 36).primary();
    table.string('api_key_hash', 64).notNullable();
    table.string('endpoint', 255).notNullable();
    table.string('method', 10);
    table.string('ip_address', 50);
    table.text('request_body');
    table.integer('response_code');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('api_key_hash');
    table.index('created_at');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('api_logs');
};
