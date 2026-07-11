'use strict';

const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

const generatePDF = (auditData, hash) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const chunks = [];

    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on('error', reject);

    doc.fontSize(16).text('Audit Report', { align: 'center', underline: true });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Export Date: ${new Date(auditData.exportDate).toLocaleString()}`);
    doc.text(`Total Records: ${auditData.totalRecords}`);
    doc.moveDown();

    if (auditData.filters.startDate || auditData.filters.endDate) {
      doc.fontSize(10).font('Helvetica-Bold').text('Date Range:');
      if (auditData.filters.startDate) {
        doc.fontSize(9).font('Helvetica').text(`  From: ${new Date(auditData.filters.startDate).toLocaleString()}`);
      }
      if (auditData.filters.endDate) {
        doc.fontSize(9).font('Helvetica').text(`  To: ${new Date(auditData.filters.endDate).toLocaleString()}`);
      }
      doc.moveDown();
    }

    if (auditData.filters.userId) {
      doc.fontSize(10).font('Helvetica-Bold').text('User ID:');
      doc.fontSize(9).font('Helvetica').text(`  ${auditData.filters.userId}`);
      doc.moveDown();
    }

    if (auditData.filters.entityType) {
      doc.fontSize(10).font('Helvetica-Bold').text('Entity Type:');
      doc.fontSize(9).font('Helvetica').text(`  ${auditData.filters.entityType}`);
      doc.moveDown();
    }

    doc.addPage();
    doc.fontSize(12).text('Audit Logs', { underline: true });
    doc.moveDown();

    auditData.logs.forEach((log, index) => {
      doc.fontSize(9);
      doc.text(`${index + 1}. Action: ${log.action}`, { continued: false });
      doc.text(`   Entity: ${log.entityType} (ID: ${log.entityId})`);
      doc.text(`   User ID: ${log.userId}`);
      doc.text(`   Timestamp: ${new Date(log.timestamp).toLocaleString()}`);
      if (log.ipAddress) {
        doc.text(`   IP Address: ${log.ipAddress}`);
      }
      if (log.oldValue || log.newValue) {
        doc.text(`   Changes:`);
        if (log.oldValue) {
          doc.text(`     Old: ${JSON.stringify(log.oldValue)}`);
        }
        if (log.newValue) {
          doc.text(`     New: ${JSON.stringify(log.newValue)}`);
        }
      }
      doc.moveDown(0.5);
    });

    doc.addPage();
    doc.fontSize(10).text('Integrity Verification', { underline: true });
    doc.moveDown();
    doc.fontSize(9).text('Digital Signature (SHA-256):', { continued: true });
    doc.fontSize(8).text(hash, { wordWrap: true });

    doc.end();
  });
};

const generateXLSX = (auditData, hash) => {
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ['Audit Report Summary'],
    [],
    ['Export Date', new Date(auditData.exportDate).toLocaleString()],
    ['Total Records', auditData.totalRecords],
    [],
    ['Filters'],
    ['Start Date', auditData.filters.startDate || 'N/A'],
    ['End Date', auditData.filters.endDate || 'N/A'],
    ['User ID', auditData.filters.userId || 'N/A'],
    ['Entity Type', auditData.filters.entityType || 'N/A'],
    ['Entity ID', auditData.filters.entityId || 'N/A'],
    [],
    ['Digital Signature (SHA-256)', hash],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const logsData = [
    ['ID', 'Action', 'Entity Type', 'Entity ID', 'User ID', 'Timestamp', 'IP Address', 'Old Value', 'New Value'],
    ...auditData.logs.map(log => [
      log.id,
      log.action,
      log.entityType,
      log.entityId,
      log.userId,
      new Date(log.timestamp).toLocaleString(),
      log.ipAddress || '',
      JSON.stringify(log.oldValue || {}),
      JSON.stringify(log.newValue || {}),
    ]),
  ];

  const logsSheet = XLSX.utils.aoa_to_sheet(logsData);
  logsSheet['!cols'] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(workbook, logsSheet, 'Logs');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return Promise.resolve(buffer);
};

module.exports = {
  generatePDF,
  generateXLSX,
};
