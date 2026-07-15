const db = require('../config/database');
const { generateUUID, now } = require('../utils/uuid');

const RfqSupplier = {
  /**
   * Send RFQ to suppliers.
   */
  async sendToSuppliers(rfqId, supplierIds) {
    const nowStr = now();

    const records = await db.transaction(async (trx) => {
      // Check which suppliers are already associated
      const existing = await trx('rfq_suppliers')
        .where('rfq_id', rfqId)
        .whereIn('supplier_id', supplierIds)
        .pluck('supplier_id');

      const newSupplierIds = supplierIds.filter(sid => !existing.includes(sid));

      if (newSupplierIds.length > 0) {
        const insertData = newSupplierIds.map(sid => ({
          id: generateUUID(),
          rfq_id: rfqId,
          supplier_id: sid,
          responded: false,
          sent_at: nowStr,
        }));
        await trx('rfq_suppliers').insert(insertData);
      }

      // Update RFQ status to 'sent'
      await trx('rfqs').where('id', rfqId).update({ status: 'sent', updated_at: nowStr });

      // Return all supplier associations for this RFQ
      return trx('rfq_suppliers')
        .join('suppliers', 'rfq_suppliers.supplier_id', '=', 'suppliers.id')
        .where('rfq_suppliers.rfq_id', rfqId)
        .select(
          'rfq_suppliers.*',
          'suppliers.name as supplier_name',
          'suppliers.contact_person as supplier_contact_person',
          'suppliers.phone as supplier_phone',
          'suppliers.email as supplier_email'
        );
    });

    return records;
  },

  /**
   * Record a supplier's response (quote).
   */
  async recordResponse(rfqId, supplierId, { quote_amount, quote_notes }) {
    const nowStr = now();

    await db('rfq_suppliers')
      .where({ rfq_id: rfqId, supplier_id: supplierId })
      .update({
        responded: true,
        quote_amount: quote_amount || null,
        quote_notes: quote_notes || '',
        responded_at: nowStr,
      });

    // Update RFQ status to 'quoted'
    await db('rfqs').where('id', rfqId).update({ status: 'quoted', updated_at: nowStr });

    return db('rfq_suppliers')
      .where({ rfq_id: rfqId, supplier_id: supplierId })
      .first();
  },

  /**
   * Close an RFQ.
   */
  async closeRfq(rfqId) {
    const nowStr = now();
    await db('rfqs').where('id', rfqId).update({ status: 'closed', updated_at: nowStr });
    return true;
  },
};

module.exports = RfqSupplier;
