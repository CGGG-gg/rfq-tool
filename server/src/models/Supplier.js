const db = require('../config/database');
const { generateUUID, now } = require('../utils/uuid');

const Supplier = {
  /**
   * List suppliers with pagination and search.
   */
  async list({ page = 1, limit = 20, q, category }) {
    let query = db('suppliers');

    if (q) {
      query = query.where(function () {
        this.where('name', 'like', `%${q}%`)
          .orWhere('contact_person', 'like', `%${q}%`)
          .orWhere('phone', 'like', `%${q}%`);
      });
    }
    if (category) {
      query = query.where('categories', 'like', `%${category}%`);
    }

    const totalQuery = query.clone().count('* as total').first();

    const offset = (page - 1) * limit;
    const data = await query
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const totalResult = await totalQuery;
    const total = totalResult.total;

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    };
  },

  /**
   * Find a supplier by ID.
   */
  async findById(id) {
    return db('suppliers').where('id', id).first();
  },

  /**
   * Find supplier with associated RFQs.
   */
  async findByIdWithRfqs(id) {
    const supplier = await db('suppliers').where('id', id).first();
    if (!supplier) return null;

    const rfqs = await db('rfq_suppliers')
      .join('rfqs', 'rfq_suppliers.rfq_id', '=', 'rfqs.id')
      .where('rfq_suppliers.supplier_id', id)
      .select('rfqs.*', 'rfq_suppliers.responded', 'rfq_suppliers.quote_amount',
        'rfq_suppliers.quote_notes', 'rfq_suppliers.sent_at', 'rfq_suppliers.responded_at')
      .orderBy('rfq_suppliers.sent_at', 'desc');

    return { ...supplier, rfqs };
  },

  /**
   * Create a new supplier.
   */
  async create(data) {
    const id = generateUUID();
    const nowStr = now();

    await db('suppliers').insert({
      id,
      name: data.name,
      contact_person: data.contact_person || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      categories: data.categories ? JSON.stringify(data.categories) : '[]',
      notes: data.notes || '',
      created_at: nowStr,
      updated_at: nowStr,
    });

    return this.findById(id);
  },

  /**
   * Update a supplier.
   */
  async update(id, data) {
    const supplier = await db('suppliers').where('id', id).first();
    if (!supplier) return null;

    const updateData = { updated_at: now() };
    const fields = ['name', 'contact_person', 'phone', 'email', 'address', 'notes'];
    fields.forEach(f => {
      if (data[f] !== undefined) updateData[f] = data[f];
    });
    if (data.categories !== undefined) {
      updateData.categories = JSON.stringify(data.categories);
    }

    await db('suppliers').where('id', id).update(updateData);
    return this.findById(id);
  },

  /**
   * Delete a supplier.
   */
  async delete(id) {
    const deleted = await db('suppliers').where('id', id).del();
    return deleted > 0;
  },
};

module.exports = Supplier;
