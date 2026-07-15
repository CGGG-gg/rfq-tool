const db = require('../config/database');
const { generateUUID, now } = require('../utils/uuid');

const Webhook = {
  async create({ name, url, events, api_key_hash }) {
    const id = generateUUID();
    const nowStr = now();

    await db('webhooks').insert({
      id,
      name: name || '',
      url,
      events: JSON.stringify(events),
      api_key_hash,
      is_active: true,
      created_at: nowStr,
    });

    return this.findById(id);
  },

  async findById(id) {
    return db('webhooks').where('id', id).first();
  },

  async listByApiKey(apiKeyHash) {
    return db('webhooks').where('api_key_hash', apiKeyHash).orderBy('created_at', 'desc');
  },

  async listActiveByEvent(event) {
    return db('webhooks')
      .where('is_active', true)
      .where('events', 'like', `%${event}%`);
  },

  async delete(id, apiKeyHash) {
    const deleted = await db('webhooks')
      .where({ id, api_key_hash: apiKeyHash })
      .del();
    return deleted > 0;
  },

  async deactivate(id) {
    await db('webhooks').where('id', id).update({ is_active: false });
    return true;
  },
};

module.exports = Webhook;
