const db = require('../config/database');
const { generateUUID, now } = require('../utils/uuid');

const RfqItem = {
  /**
   * Get a single item by ID.
   */
  async findById(id) {
    return db('rfq_items').where('id', id).first();
  },

  /**
   * Add an item to an RFQ.
   */
  async create(rfqId, itemData) {
    const id = generateUUID();
    const nowStr = now();

    // Get current max sort_order
    const max = await db('rfq_items')
      .where('rfq_id', rfqId)
      .max('sort_order as max_order')
      .first();

    const sortOrder = itemData.sort_order !== undefined
      ? itemData.sort_order
      : (max.max_order !== null ? max.max_order + 1 : 0);

    await db('rfq_items').insert({
      id,
      rfq_id: rfqId,
      product_name: itemData.product_name,
      specification: itemData.specification || '',
      quantity: itemData.quantity || 1,
      unit: itemData.unit || '个',
      target_price: itemData.target_price || null,
      delivery_date: itemData.delivery_date || null,
      remarks: itemData.remarks || '',
      sort_order: sortOrder,
      created_at: nowStr,
    });

    // Update RFQ updated_at
    await db('rfqs').where('id', rfqId).update({ updated_at: nowStr });

    return this.findById(id);
  },

  /**
   * Update an item.
   */
  async update(id, itemData) {
    const item = await db('rfq_items').where('id', id).first();
    if (!item) return null;

    const updateData = {};
    const fields = [
      'product_name', 'specification', 'quantity', 'unit',
      'target_price', 'delivery_date', 'remarks', 'sort_order',
    ];

    fields.forEach(f => {
      if (itemData[f] !== undefined) updateData[f] = itemData[f];
    });

    if (Object.keys(updateData).length === 0) return item;

    await db('rfq_items').where('id', id).update(updateData);
    await db('rfqs').where('id', item.rfq_id).update({ updated_at: now() });

    return this.findById(id);
  },

  /**
   * Delete an item.
   */
  async delete(id) {
    const item = await db('rfq_items').where('id', id).first();
    if (item) {
      await db('rfq_items').where('id', id).del();
      await db('rfqs').where('id', item.rfq_id).update({ updated_at: now() });
    }
    return !!item;
  },

  /**
   * Bulk insert items into an RFQ.
   */
  async bulkCreate(rfqId, items) {
    const nowStr = now();
    const max = await db('rfq_items')
      .where('rfq_id', rfqId)
      .max('sort_order as max_order')
      .first();

    let nextOrder = max.max_order !== null ? max.max_order + 1 : 0;

    const records = items.map((item, i) => ({
      id: generateUUID(),
      rfq_id: rfqId,
      product_name: item.product_name,
      specification: item.specification || '',
      quantity: item.quantity || 1,
      unit: item.unit || '个',
      target_price: item.target_price || null,
      delivery_date: item.delivery_date || null,
      remarks: item.remarks || '',
      sort_order: item.sort_order !== undefined ? item.sort_order : nextOrder + i,
      created_at: nowStr,
    }));

    await db('rfq_items').insert(records);
    await db('rfqs').where('id', rfqId).update({ updated_at: nowStr });

    return db('rfq_items').where('rfq_id', rfqId).orderBy('sort_order', 'asc');
  },
};

module.exports = RfqItem;
