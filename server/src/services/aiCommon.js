/**
 * Shared logic for AI image analysis services (DeepSeek, Kimi, etc.)
 */
const fs = require('fs');

/**
 * The standard system prompt for RFQ document extraction.
 */
const RFQ_EXTRACTION_PROMPT = `你是一个专业的采购文档解析助手。你的任务是从RFQ（询价单）、产品规格书、采购清单等文档图片中提取结构化信息。

请仔细分析图片中的所有文字和表格，提取以下字段：

对于每个产品/物料行项目，返回：
- product_name: 产品名称/物料名称
- specification: 规格型号
- quantity: 数量（数字）
- unit: 单位（如：个、件、台、套、kg、吨、米、把、箱等）
- target_price: 目标单价（数字，如果有）
- delivery_date: 交货日期（如果有）
- remarks: 备注/其他要求（如果有）

返回格式：
{
  "items": [
    {
      "product_name": "...",
      "specification": "...",
      "quantity": 100,
      "unit": "个",
      "target_price": null,
      "delivery_date": "...",
      "remarks": "..."
    }
  ],
  "summary": "简要概述文档内容..."
}

重要规则：
1. 如果图片中有多个产品，请每个产品作为一个独立的对象放入items数组
2. 如果某个字段在图片中没有找到，请设为null
3. 数量和价格请提取为数字类型（不是字符串）
4. 如果有表格，请逐行提取
5. 只返回JSON，不要返回其他解释文字`;

/**
 * Read an image file and convert to base64 data URI.
 * @param {string} imagePath
 * @returns {{ dataUri: string, mimeType: string }}
 */
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const ext = imagePath.split('.').pop().toLowerCase();
  const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp' };
  const mimeType = mimeMap[ext] || 'jpeg';
  const base64Image = imageBuffer.toString('base64');
  const dataUri = `data:image/${mimeType};base64,${base64Image}`;
  return { dataUri, mimeType };
}

/**
 * Parse AI response content (may be JSON string or markdown-wrapped JSON).
 * @param {string} content
 * @returns {Object}
 */
function parseResponseContent(content) {
  if (!content) {
    throw new Error('AI returned empty response.');
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    // Sometimes the content is wrapped in markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error(`Failed to parse AI response as JSON: ${content.substring(0, 200)}`);
  }
}

/**
 * Normalize a single item from an AI response.
 * @param {Object} item
 * @returns {Object}
 */
function normalizeItem(item) {
  return {
    product_name: item.product_name || '',
    specification: item.specification || null,
    quantity: parseFloat(item.quantity) || 1,
    unit: item.unit || '个',
    target_price: item.target_price ? parseFloat(item.target_price) : null,
    delivery_date: item.delivery_date || null,
    remarks: item.remarks || null,
  };
}

/**
 * Extract items from a parsed AI response.
 * @param {Object} parsed
 * @returns {Array}
 */
function extractItems(parsed) {
  const items = (parsed.items || []).map(normalizeItem);
  if (items.length === 0 && parsed.product_name) {
    // Single item returned instead of items array
    items.push(normalizeItem(parsed));
  }
  return items;
}

module.exports = {
  RFQ_EXTRACTION_PROMPT,
  imageToBase64,
  parseResponseContent,
  normalizeItem,
  extractItems,
};
