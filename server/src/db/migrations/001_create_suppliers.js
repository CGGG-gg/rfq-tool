exports.up = function (knex) {
  return knex.schema.createTable('suppliers', (table) => {
    table.string('id', 36).primary();
    table.string('name', 255).notNullable();
    table.string('contact_person', 100);
    table.string('phone', 50);
    table.string('email', 255);
    table.string('address', 500);
    table.text('categories'); // JSON array
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('name');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('suppliers');
};
