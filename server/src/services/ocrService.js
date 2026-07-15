const fs = require('fs');
const config = require('../config');

/**
 * Analyze an image using Tencent Cloud OCR as a fallback.
 * Extracts text lines and attempts to parse them into structured RFQ data.
 *
 * @param {string} imagePath - Absolute path to the image file
 * @returns {Promise<{items: Array, raw_text: Array}>}
 */
async function recognizeWithOCR(imagePath) {
  const secretId = config.tencent.secretId;
  const secretKey = config.tencent.secretKey;

  if (!secretId || secretId === 'your_secret_id' || !secretKey || secretKey === 'your_secret_key') {
    throw new Error('Tencent Cloud OCR credentials are not configured.');
  }

  let client;
  try {
    const tencentcloud = require('tencentcloud-sdk-nodejs-ocr');
    const OcrClient = tencentcloud.ocr.v20181119.Client;

    client = new OcrClient({
      credential: {
        secretId: secretId,
        secretKey: secretKey,
      },
      region: 'ap-guangzhou',
    });
  } catch (e) {
    throw new Error(`Failed to initialize Tencent Cloud OCR client: ${e.message}`);
  }

  // Read image and convert to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  try {
    const result = await client.GeneralAccurateOCR({
      ImageBase64: base64Image,
      EnableDetectText: true,
    });

    const textLines = (result.TextDetections || []).map(d => d.DetectedText);
    const allText = textLines.join('\n');

    // Try to parse the raw text into structured items
    const items = parseTextToItems(textLines, allText);

    return {
      items,
      raw_text: textLines,
      all_text: allText,
      source: 'tencent_ocr',
    };
  } catch (error) {
    throw new Error(`Tencent Cloud OCR error: ${error.message}`);
  }
}

/**
 * Attempt to parse raw OCR text lines into structured RFQ items.
 * This is a best-effort parser using regex patterns for common RFQ formats.
 */
function parseTextToItems(textLines, allText) {
  const items = [];

  // Strategy 1: Look for tabular data with quantity patterns
  // Pattern: something followed by a number + unit (like "100个", "50台", "200kg")
  const unitPattern = /([一-龥a-zA-Z0-9\s\-/]+?)\s*[：:]*\s*(\d+(?:\.\d+)?)\s*([一-龥]{1,3})\s*$/;
  const pricePattern = /(\d+(?:\.\d+)?)\s*元/;
  const datePattern = /(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}月\d{1,2}日)/;

  for (const line of textLines) {
    const match = line.match(unitPattern);
    if (match) {
      const item = {
        product_name: match[1].trim(),
        specification: null,
        quantity: parseFloat(match[2]) || 1,
        unit: match[3] || '个',
        target_price: null,
        delivery_date: null,
        remarks: null,
      };

      // Try to extract price from the same line
      const priceMatch = line.match(pricePattern);
      if (priceMatch) {
        item.target_price = parseFloat(priceMatch[1]);
      }

      // Try to extract date
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        item.delivery_date = dateMatch[0];
      }

      items.push(item);
    }
  }

  // Strategy 2: If no items parsed by pattern matching, try to find any recognized text
  // and create a single item with the raw text as notes
  if (items.length === 0 && textLines.length > 0) {
    // Assume first few lines contain product info
    const productName = textLines[0] || '';
    const restLines = textLines.slice(1).join('; ');

    items.push({
      product_name: productName.length > 50 ? productName.substring(0, 50) + '...' : productName,
      specification: null,
      quantity: 1,
      unit: '个',
      target_price: null,
      delivery_date: null,
      remarks: restLines || null,
    });
  }

  return items;
}

module.exports = { recognizeWithOCR };
