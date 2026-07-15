const db = require('../config/database');
const { generateUUID, now } = require('../utils/uuid');

const ApiLog = {
  async create({ api_key_hash, endpoint, method, ip_address, request_body, response_code }) {
    const id = generateUUID();
    const nowStr = now();

    await db('api_logs').insert({
      id,
      api_key_hash,
      endpoint,
      method,
      ip_address,
      request_body: request_body ? request_body.substring(0, 10000) : null, // truncate
      response_code,
      created_at: nowStr,
    });

    return true;
  },

  async list({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const data = await db('api_logs')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const total = await db('api_logs').count('* as total').first();

    return {
      page,
      limit,
      total: total.total,
      totalPages: Math.ceil(total.total / limit),
      data,
    };
  },
};

module.exports = ApiLog;
