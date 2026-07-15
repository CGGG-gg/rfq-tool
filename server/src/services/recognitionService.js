const { createValidationError } = require('../middleware/errorHandler');
const RfqImage = require('../models/RfqImage');
const RfqItem = require('../models/RfqItem');
const { resolvePath } = require('../utils/fileHelper');

/**
 * Trigger AI recognition on all images associated with an RFQ.
 * Calls DeepSeek and Kimi in parallel, merges the best results.
 *
 * @param {string} rfqId - RFQ ID
 * @returns {Promise<{items: Array, images_processed: number, source: string}>}
 */
async function recognizeRfqImages(rfqId) {
  const images = await RfqImage.getByRfqId(rfqId);

  if (images.length === 0) {
    throw createValidationError('请先上传图片，再触发识别。');
  }

  const allItems = [];
  let primarySource = 'none';
  let imagesProcessed = 0;

  for (const image of images) {
    try {
      const result = await recognizeFromImage(resolvePath(image.file_path));
      if (result.items.length > 0) {
        allItems.push(...result.items);
        primarySource = result.source;
      }
      imagesProcessed++;
    } catch (err) {
      console.error(`Recognition failed for image ${image.id}: ${err.message}`);
    }
  }

  return {
    items: allItems,
    images_processed: imagesProcessed,
    total_images: images.length,
    source: primarySource,
  };
}

/**
 * Recognize a single image using DeepSeek + Kimi in parallel.
 * Results are merged with deduplication. If one fails, use the other.
 *
 * @param {string} imagePath - Absolute path to the image file
 * @returns {Promise<{items: Array, source: string}>}
 */
async function recognizeFromImage(imagePath) {
  const { analyzeImage: deepseekAnalyze } = require('./aiService');
  const { analyzeImage: kimiAnalyze } = require('./kimiService');

  const results = [];

  const errors = [];

  // Run both AIs in parallel. Kimi is primary (supports vision), DeepSeek as backup.
  const [kimiResult, deepseekResult] = await Promise.allSettled([
    kimiAnalyze(imagePath).catch(err => {
      errors.push(`Kimi: ${err.message}`);
      console.log(`Kimi failed: ${err.message}`);
      return null;
    }),
    deepseekAnalyze(imagePath).catch(err => {
      errors.push(`DeepSeek: ${err.message}`);
      console.log(`DeepSeek failed: ${err.message}`);
      return null;
    }),
  ]);

  const ks = kimiResult.status === 'fulfilled' ? kimiResult.value : null;
  const ds = deepseekResult.status === 'fulfilled' ? deepseekResult.value : null;

  // Collect items from both
  if (ds && ds.items.length > 0) {
    results.push(...ds.items.map(item => ({ ...item, _source: 'deepseek' })));
  }
  if (ks && ks.items.length > 0) {
    results.push(...ks.items.map(item => ({ ...item, _source: 'kimi' })));
  }

  // Deduplicate: items with same product_name are merged (prefer the one with more fields filled)
  const merged = deduplicateItems(results);

  // Determine source label
  let sourceLabel = 'none';
  if (ks && ds) sourceLabel = 'kimi+deepseek';
  else if (ks) sourceLabel = 'kimi';
  else if (ds) sourceLabel = 'deepseek';

  // Clean up internal _source field
  const items = merged.map(({ _source, ...item }) => item);

  return { items, source: sourceLabel, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Deduplicate items from multiple AI sources.
 * Items with identical product_name are merged, keeping non-null values.
 */
function deduplicateItems(items) {
  const seen = new Map();

  for (const item of items) {
    const key = item.product_name.trim().toLowerCase();
    if (seen.has(key)) {
      // Merge: fill in null fields from the other source
      const existing = seen.get(key);
      for (const field of Object.keys(item)) {
        if ((existing[field] === null || existing[field] === undefined || existing[field] === '') &&
            item[field] !== null && item[field] !== undefined && item[field] !== '') {
          existing[field] = item[field];
        }
      }
      // Track which sources contributed
      if (!existing._sources) existing._sources = [existing._source];
      existing._sources.push(item._source);
      existing._source = [...new Set(existing._sources)].join('+');
    } else {
      seen.set(key, { ...item });
    }
  }

  return Array.from(seen.values());
}

/**
 * Save recognized items into the RFQ.
 */
async function saveRecognizedItems(rfqId, items) {
  if (!items || items.length === 0) {
    throw new Error('No items to save.');
  }
  return RfqItem.bulkCreate(rfqId, items);
}

module.exports = { recognizeRfqImages, recognizeFromImage, saveRecognizedItems };
