const { pool } = require('../config/db');

async function generateProductCode() {
  const currentYear = new Date().getFullYear();
  const prefix = `ECO-${currentYear}-`;
  
  // Find highest current sequence number for this year
  const [rows] = await pool.query(
    "SELECT product_code FROM products WHERE product_code LIKE ? ORDER BY id DESC LIMIT 1",
    [`${prefix}%`]
  );

  let nextSeq = 1;
  if (rows.length > 0 && rows[0].product_code) {
    const parts = rows[0].product_code.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num)) {
        nextSeq = num + 1;
      }
    }
  }

  return `${prefix}${String(nextSeq).padStart(5, '0')}`;
}

async function generateEmployeeCode() {
  const [rows] = await pool.query(
    "SELECT employee_code FROM employees WHERE employee_code LIKE 'EMP%' ORDER BY id DESC LIMIT 1"
  );

  let nextSeq = 1;
  if (rows.length > 0 && rows[0].employee_code) {
    const num = parseInt(rows[0].employee_code.replace('EMP', ''), 10);
    if (!isNaN(num)) {
      nextSeq = num + 1;
    }
  }

  return `EMP${String(nextSeq).padStart(3, '0')}`;
}

module.exports = {
  generateProductCode,
  generateEmployeeCode
};
