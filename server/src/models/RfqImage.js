const db = require('../config/database');
const { generateUUID, now } = require('../utils/uuid');

const RfqImage = {
  /**
   * Get an image by ID.
   */
  async findById(id) {
    return db('rfq_images').where('id', id).first();
  },

  /**
   * Create an image record.
   */
  async create({ rfq_id, filename, original_name, mime_type, file_size, file_path, ocr_result }) {
    const id = generateUUID();
    const nowStr = now();

    await db('rfq_images').insert({
      id,
      rfq_id: rfq_id || null,
      filename,
      original_name,
      mime_type: mime_type || null,
      file_size: file_size || null,
      file_path,
      ocr_result: ocr_result ? JSON.stringify(ocr_result) : null,
      created_at: nowStr,
    });

    return this.findById(id);
  },

  /**
   * Associate an image with an RFQ.
   */
  async associateWithRfq(imageId, rfqId) {
    await db('rfq_images').where('id', imageId).update({ rfq_id: rfqId });
    return this.findById(imageId);
  },

  /**
   * Delete an image record and return it.
   */
  async delete(id) {
    const image = await db('rfq_images').where('id', id).first();
    if (image) {
      await db('rfq_images').where('id', id).del();
    }
    return image;
  },

  /**
   * Get all images for an RFQ.
   */
  async getByRfqId(rfqId) {
    return db('rfq_images').where('rfq_id', rfqId).orderBy('created_at', 'asc');
  },
};

module.exports = RfqImage;
