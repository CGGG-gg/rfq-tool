const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const path = require('path');

/**
 * GET /openapi/v1/docs
 * Swagger UI for Open API documentation.
 */
router.get('/docs', swaggerUi.setup(require('../../swagger/openapi.json'), {
  customSiteTitle: 'RFQ Tool - Open API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

/**
 * GET /openapi/v1/docs.json
 * OpenAPI 3.0 spec in JSON format.
 */
router.get('/docs.json', (req, res) => {
  res.json(require('../../swagger/openapi.json'));
});

module.exports = router;
