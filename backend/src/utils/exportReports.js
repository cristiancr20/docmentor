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
      doc.text(`   User: ${log.userName ? `${log.userName} (ID: ${log.userId})` : log.userId}`);
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
    doc.fontSize(10).text('Verificación de integridad', { underline: true });
    doc.moveDown();
    // No es una firma digital: es un checksum sin clave. Llamarlo "Digital
    // Signature" sugería un no repudio que no ofrece.
    doc.fontSize(9).text('Checksum de contenido (SHA-256):');
    doc.fontSize(8).text(hash);

    doc.end();
  });
};

const DATE_FORMAT = 'yyyy-mm-dd hh:mm:ss';

// Devuelve un Date válido o '' para que la celda quede como fecha real de Excel
const toDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? '' : date;
};

// Aplica el formato de fecha consistente a todas las celdas de tipo fecha
const applyDateFormat = (sheet) => {
  Object.keys(sheet).forEach((address) => {
    if (address[0] !== '!' && sheet[address].t === 'd') {
      sheet[address].z = DATE_FORMAT;
    }
  });
};

const generateXLSX = (auditData, hash) => {
  const workbook = XLSX.utils.book_new();
  const summary = auditData.summary || {};
  const userActivity = auditData.userActivity || [];

  // Hoja 1: Resumen
  const summaryData = [
    ['Reporte de Auditoría - Resumen'],
    [],
    ['Fecha de exportación', toDate(auditData.exportDate)],
    ['Total de cambios', summary.totalChanges ?? auditData.totalRecords],
    ['Usuarios activos', summary.activeUsers ?? 0],
    [],
    ['Cambios por tipo de acción'],
    ['Acción', 'Cantidad'],
    ...Object.entries(summary.changesByAction || {}).map(([action, count]) => [action, count]),
    [],
    ['Cambios por tipo de entidad'],
    ['Entidad', 'Cantidad'],
    ...Object.entries(summary.changesByEntityType || {}).map(([entity, count]) => [entity, count]),
    [],
    ['Filtros aplicados'],
    ['Fecha inicio', toDate(auditData.filters.startDate) || 'N/A'],
    ['Fecha fin', toDate(auditData.filters.endDate) || 'N/A'],
    ['ID de usuario', auditData.filters.userId || 'N/A'],
    ['Tipo de entidad', auditData.filters.entityType || 'N/A'],
    ['ID de entidad', auditData.filters.entityId || 'N/A'],
    [],
    ['Firma digital (SHA-256)', hash],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData, { cellDates: true });
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 40 }];
  applyDateFormat(summarySheet);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Detalles (un log por fila)
  const detailsData = [
    ['Timestamp', 'Usuario', 'Acción', 'Entidad', 'ID Entidad', 'Valor Anterior', 'Valor Nuevo', 'Dirección IP'],
    ...auditData.logs.map(log => [
      toDate(log.timestamp),
      log.userName || `Usuario ${log.userId}`,
      log.action,
      log.entityType,
      log.entityId,
      log.oldValue ? JSON.stringify(log.oldValue) : '',
      log.newValue ? JSON.stringify(log.newValue) : '',
      log.ipAddress || '',
    ]),
  ];

  const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData, { cellDates: true });
  detailsSheet['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 35 },
    { wch: 35 },
    { wch: 15 },
  ];
  applyDateFormat(detailsSheet);
  XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Detalles');

  // Hoja 3: Usuarios (actividad por usuario)
  const usersData = [
    ['Usuario', 'Email', 'Total de acciones', 'Detalle de acciones', 'Primera actividad', 'Última actividad'],
    ...userActivity.map(activity => [
      activity.userName,
      activity.email || '',
      activity.totalActions,
      Object.entries(activity.actions || {})
        .map(([action, count]) => `${action}: ${count}`)
        .join(', '),
      toDate(activity.firstActivity),
      toDate(activity.lastActivity),
    ]),
  ];

  const usersSheet = XLSX.utils.aoa_to_sheet(usersData, { cellDates: true });
  usersSheet['!cols'] = [
    { wch: 20 },
    { wch: 28 },
    { wch: 16 },
    { wch: 35 },
    { wch: 20 },
    { wch: 20 },
  ];
  applyDateFormat(usersSheet);
  XLSX.utils.book_append_sheet(workbook, usersSheet, 'Usuarios');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', cellDates: true });
  return Promise.resolve(buffer);
};

module.exports = {
  generatePDF,
  generateXLSX,
};
