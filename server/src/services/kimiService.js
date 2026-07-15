const axios = require('axios');
const config = require('../config');
const { RFQ_EXTRACTION_PROMPT, imageToBase64, parseResponseContent, extractItems } = require('./aiCommon');

/**
 * Kimi (Moonshot) Vision API — image to structured RFQ data.
 */
async function analyzeImage(imagePath) {
  const apiKey = config.kimi.apiKey;
  const baseUrl = config.kimi.baseUrl;
  const model = config.kimi.model;

  if (!apiKey || apiKey === 'your_kimi_api_key_here') {
    throw new Error('Kimi API key is not configured. Set KIMI_API_KEY in .env');
  }

  const { dataUri } = imageToBase64(imagePath);

  const axiosOpts = { timeout: 60000 };
  if (config.httpProxy) {
    const u = new URL(config.httpProxy);
    axiosOpts.proxy = { protocol: u.protocol.replace(':',''), host: u.hostname, port: parseInt(u.port)||7890 };
  }

  try {
    const res = await axios.post(`${baseUrl}/chat/completions`, {
      model,
      messages: [
        { role: 'system', content: RFQ_EXTRACTION_PROMPT },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: dataUri } },
          { type: 'text', text: '请解析这张询价单/产品规格图片，提取所有产品行项目信息。只返回JSON格式结果。' },
        ]},
      ],
      max_tokens: 4096,
      temperature: 0.1,
    }, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      ...axiosOpts,
    });

    const content = res.data.choices[0]?.message?.content;
    const parsed = parseResponseContent(content);
    return { items: extractItems(parsed), summary: parsed.summary || null, source: 'kimi' };
  } catch (error) {
    if (error.response) {
      throw new Error(`Kimi API error (${error.response.status}): ${error.response.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

module.exports = { analyzeImage };
