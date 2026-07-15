const ExcelJS = require('exceljs');
const path = require('path');
const Rfq = require('../models/Rfq');
const { ensureDir, generateFilename } = require('../utils/fileHelper');
const config = require('../config');

/**
 * Export an RFQ to Excel (.xlsx) file.
 * @param {string} rfqId
 * @returns {Promise<string>} File path of the generated Excel file
 */
async function exportRfq(rfqId) {
  const rfq = await Rfq.findById(rfqId);
  if (!rfq) {
    throw new Error('RFQ not found.');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RFQ Tool';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('询价单');

  // Define columns
  sheet.columns = [
    { header: '序号', key: 'no', width: 6 },
    { header: '产品名称', key: 'product_name', width: 25 },
    { header: '规格型号', key: 'specification', width: 20 },
    { header: '数量', key: 'quantity', width: 10 },
    { header: '单位', key: 'unit', width: 8 },
    { header: '目标单价(元)', key: 'target_price', width: 14 },
    { header: '交货日期', key: 'delivery_date', width: 14 },
    { header: '备注', key: 'remarks', width: 20 },
  ];

  // Title row (merged)
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = rfq.title;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Info row
  sheet.mergeCells('A2:H2');
  const infoCell = sheet.getCell('A2');
  infoCell.value = `状态: ${rfq.status}  |  创建时间: ${new Date(rfq.created_at).toLocaleDateString('zh-CN')}  |  项目数: ${rfq.items.length}`;
  infoCell.font = { size: 10, color: { argb: '666666' } };
  infoCell.alignment = { horizontal: 'center' };

  // Header row (row 4)
  const headerRow = sheet.getRow(4);
  headerRow.values = ['序号', '产品名称', '规格型号', '数量', '单位', '目标单价(元)', '交货日期', '备注'];
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 24;

  // Border style for header
  headerRow.eachCell(cell => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Data rows
  rfq.items.forEach((item, index) => {
    const row = sheet.addRow({
      no: index + 1,
      product_name: item.product_name,
      specification: item.specification || '',
      quantity: item.quantity,
      unit: item.unit,
      target_price: item.target_price || '',
      delivery_date: item.delivery_date || '',
      remarks: item.remarks || '',
    });

    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle' };
    });
  });

  // Supplier section if any
  if (rfq.suppliers && rfq.suppliers.length > 0) {
    const startRow = 7 + rfq.items.length;
    sheet.mergeCells(`A${startRow}:H${startRow}`);
    const supTitle = sheet.getCell(`A${startRow}`);
    supTitle.value = '供应商报价情况';
    supTitle.font = { bold: true, size: 12 };

    const supHeaderRow = sheet.getRow(startRow + 1);
    supHeaderRow.values = ['供应商', '联系人', '电话', '是否回复', '报价金额(元)', '回复备注', '', ''];
    supHeaderRow.font = { bold: true, size: 11 };
    supHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD5E8D4' },
    };

    rfq.suppliers.forEach((sup) => {
      sheet.addRow({
        product_name: sup.supplier_name,
        specification: sup.supplier_contact_person || '',
        quantity: sup.supplier_phone || '',
        unit: sup.responded ? '是' : '否',
        target_price: sup.quote_amount || '',
        remarks: sup.quote_notes || '',
      });
    });
  }

  // Generate file
  const exportDir = ensureDir(config.upload.exportDir);
  const filename = `rfq_${rfqId.substring(0, 8)}_${Date.now()}.xlsx`;
  const filePath = path.join(exportDir, filename);

  await workbook.xlsx.writeFile(filePath);

  return filePath;
}

module.exports = { exportRfq };
