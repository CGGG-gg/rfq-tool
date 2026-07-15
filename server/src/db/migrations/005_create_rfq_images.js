exports.up = function (knex) {
  return knex.schema.createTable('rfq_images', (table) => {
    table.string('id', 36).primary();
    table.string('rfq_id', 36).references('id').inTable('rfqs').onDelete('SET NULL');
    table.string('filename', 255).notNullable();
    table.string('original_name', 255).notNullable();
    table.string('mime_type', 100);
    table.integer('file_size');
    table.string('file_path', 500).notNullable();
    table.text('ocr_result'); // raw JSON from AI/OCR
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('rfq_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('rfq_images');
};
