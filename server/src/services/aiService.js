const axios = require('axios');
const config = require('../config');
const { RFQ_EXTRACTION_PROMPT, imageToBase64, parseResponseContent, extractItems } = require('./aiCommon');

/**
 * DeepSeek Vision API — image to structured RFQ data.
 */
async function analyzeImage(imagePath) {
  const apiKey = config.deepseek.apiKey;
  const baseUrl = config.deepseek.baseUrl;
  const model = config.deepseek.model;

  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    throw new Error('DeepSeek API key is not configured.');
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
      response_format: { type: 'json_object' },
      max_tokens: 4096,
      temperature: 0.1,
    }, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      ...axiosOpts,
    });

    const content = res.data.choices[0]?.message?.content;
    const parsed = parseResponseContent(content);
    return { items: extractItems(parsed), summary: parsed.summary || null, source: 'deepseek' };
  } catch (error) {
    if (error.response) {
      throw new Error(`DeepSeek API error (${error.response.status}): ${error.response.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

module.exports = { analyzeImage };
