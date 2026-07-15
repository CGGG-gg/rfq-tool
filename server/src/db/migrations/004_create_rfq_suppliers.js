exports.up = function (knex) {
  return knex.schema.createTable('rfq_suppliers', (table) => {
    table.string('id', 36).primary();
    table.string('rfq_id', 36).notNullable().references('id').inTable('rfqs').onDelete('CASCADE');
    table.string('supplier_id', 36).notNullable().references('id').inTable('suppliers').onDelete('CASCADE');
    table.boolean('responded').defaultTo(false);
    table.decimal('quote_amount', 12, 2);
    table.text('quote_notes');
    table.timestamp('sent_at').defaultTo(knex.fn.now());
    table.timestamp('responded_at').nullable().defaultTo(null);
    table.unique(['rfq_id', 'supplier_id']);
    table.index('rfq_id');
    table.index('supplier_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('rfq_suppliers');
};
