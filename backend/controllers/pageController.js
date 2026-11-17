const { pool } = require('../config/db');

// Public & Admin: Get page content (about_us, contact_us)
exports.getPage = async (req, res) => {
  try {
    const { page_type } = req.params;
    const [rows] = await pool.query('SELECT * FROM pages WHERE page_type = ?', [page_type]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Page not found.' });
    }
    return res.json({ success: true, page: rows[0] });
  } catch (error) {
    console.error('getPage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch page.' });
  }
};

// Admin: Update page content
exports.updatePage = async (req, res) => {
  try {
    const { page_type } = req.params;
    const { page_title, page_description } = req.body;

    if (!page_title || !page_description) {
      return res.status(400).json({ success: false, message: 'Page title and description are required.' });
    }

    await pool.query(
      `INSERT INTO pages (page_type, page_title, page_description)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE page_title = VALUES(page_title), page_description = VALUES(page_description)`,
      [page_type, page_title, page_description]
    );

    return res.json({ success: true, message: 'Page content updated successfully.' });
  } catch (error) {
    console.error('updatePage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update page.' });
  }
};
