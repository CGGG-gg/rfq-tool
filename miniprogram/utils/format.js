/**
 * Format a date string for display.
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date with time for display.
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const date = formatDate(dateStr);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${date} ${hours}:${minutes}`;
}

/**
 * Format a number as currency.
 */
function formatCurrency(num) {
  if (num === null || num === undefined) return '-';
  const n = parseFloat(num);
  if (isNaN(n)) return num.toString();
  return '¥' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format a number with unit.
 */
function formatQuantity(quantity, unit) {
  if (quantity === null || quantity === undefined) return '-';
  return `${quantity} ${unit || '个'}`;
}

/**
 * Get status display text and color.
 */
function getStatusInfo(status) {
  const map = {
    draft: { text: '草稿', color: '#999' },
    sent: { text: '已发送', color: '#1989fa' },
    quoted: { text: '已报价', color: '#ff976a' },
    closed: { text: '已关闭', color: '#999' },
  };
  return map[status] || { text: status, color: '#999' };
}

/**
 * Truncate text to a max length.
 */
function truncate(text, maxLen = 30) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

module.exports = {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatQuantity,
  getStatusInfo,
  truncate,
};
