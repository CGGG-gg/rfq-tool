/**
 * Build a paginated response object.
 * @param {Object} options
 * @param {number} options.page - Current page (1-indexed)
 * @param {number} options.limit - Items per page
 * @param {number} options.total - Total number of items
 * @param {Array} options.data - The data for the current page
 * @returns {Object} Paginated response
 */
function paginatedResponse({ page, limit, total, data }) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    data,
  };
}

/**
 * Parse pagination parameters from query string.
 * @param {Object} query - Express req.query
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query) {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

module.exports = { paginatedResponse, parsePagination };
