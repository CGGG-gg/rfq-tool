const db = require('../config/database');
const { generateUUID, now } = require('../utils/uuid');

const Rfq = {
  /**
   * List RFQs with pagination, search, and status filter.
   */
  async list({ page = 1, limit = 20, status, q }) {
    let query = db('rfqs');

    if (status) {
      query = query.where('status', status);
    }
    if (q) {
      query = query.where(function () {
        this.where('title', 'like', `%${q}%`)
          .orWhere('id', 'like', `%${q}%`);
      });
    }

    const totalQuery = query.clone().count('* as total').first();

    const offset = (page - 1) * limit;
    const dataQuery = query
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, totalQuery]);
    const total = totalResult.total;

    // Get item counts for each RFQ
    const rfqIds = data.map(r => r.id);
    let itemCounts = {};
    if (rfqIds.length > 0) {
      const counts = await db('rfq_items')
        .select('rfq_id')
        .count('* as count')
        .whereIn('rfq_id', rfqIds)
        .groupBy('rfq_id');
      counts.forEach(c => { itemCounts[c.rfq_id] = c.count; });
    }

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: data.map(r => ({ ...r, item_count: itemCounts[r.id] || 0 })),
    };
  },

  /**
   * Find RFQ by ID with items, suppliers, and images.
   */
  async findById(id) {
    const rfq = await db('rfqs').where('id', id).first();
    if (!rfq) return null;

    const items = await db('rfq_items')
      .where('rfq_id', id)
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'asc');

    const rfqSuppliers = await db('rfq_suppliers')
      .join('suppliers', 'rfq_suppliers.supplier_id', '=', 'suppliers.id')
      .where('rfq_suppliers.rfq_id', id)
      .select(
        'rfq_suppliers.*',
        'suppliers.name as supplier_name',
        'suppliers.contact_person as supplier_contact_person',
        'suppliers.phone as supplier_phone',
        'suppliers.email as supplier_email'
      );

    const images = await db('rfq_images')
      .where('rfq_id', id)
      .orderBy('created_at', 'asc');

    return { ...rfq, items, suppliers: rfqSuppliers, images };
  },

  /**
   * Create a new RFQ with optional items.
   */
  async create({ title, notes, items = [] }) {
    const id = generateUUID();
    const nowStr = now();

    await db.transaction(async (trx) => {
      await trx('rfqs').insert({
        id,
        title,
        notes: notes || '',
        status: 'draft',
        created_at: nowStr,
        updated_at: nowStr,
      });

      if (items.length > 0) {
        const itemRecords = items.map((item, index) => ({
          id: generateUUID(),
          rfq_id: id,
          product_name: item.product_name,
          specification: item.specification || '',
          quantity: item.quantity || 1,
          unit: item.unit || '个',
          target_price: item.target_price || null,
          delivery_date: item.delivery_date || null,
          remarks: item.remarks || '',
          sort_order: item.sort_order || index,
          created_at: nowStr,
        }));
        await trx('rfq_items').insert(itemRecords);
      }
    });

    return this.findById(id);
  },

  /**
   * Update RFQ header fields.
   */
  async update(id, { title, notes, status }) {
    const rfq = await db('rfqs').where('id', id).first();
    if (!rfq) return null;

    const updateData = { updated_at: now() };

    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    await db('rfqs').where('id', id).update(updateData);
    return this.findById(id);
  },

  /**
   * Delete an RFQ and all associated data (cascade handles items, suppliers, images).
   */
  async delete(id) {
    const deleted = await db('rfqs').where('id', id).del();
    return deleted > 0;
  },
};

module.exports = Rfq;
