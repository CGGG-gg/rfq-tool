exports.up = function (knex) {
  return knex.schema.createTable('rfq_items', (table) => {
    table.string('id', 36).primary();
    table.string('rfq_id', 36).notNullable().references('id').inTable('rfqs').onDelete('CASCADE');
    table.string('product_name', 255).notNullable();
    table.text('specification');
    table.decimal('quantity', 12, 3).notNullable().defaultTo(1);
    table.string('unit', 50).notNullable().defaultTo('个');
    table.decimal('target_price', 12, 2);
    table.string('delivery_date', 100);
    table.text('remarks');
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('rfq_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('rfq_items');
};
