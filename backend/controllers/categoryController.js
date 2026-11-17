const { pool } = require('../config/db');

exports.getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      `SELECT c.id, c.category_name, c.description, c.created_at,
              COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id
       GROUP BY c.id
       ORDER BY c.category_name ASC`
    );
    return res.json({ success: true, categories });
  } catch (error) {
    console.error('getAllCategories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;
    if (!category_name || !category_name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const [existing] = await pool.query('SELECT id FROM categories WHERE category_name = ?', [category_name.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (category_name, description) VALUES (?, ?)',
      [category_name.trim(), description || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Category added successfully.',
      categoryId: result.insertId
    });
  } catch (error) {
    console.error('createCategory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description } = req.body;

    if (!category_name || !category_name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    // Check duplicate name excluding current id
    const [existing] = await pool.query(
      'SELECT id FROM categories WHERE category_name = ? AND id != ?',
      [category_name.trim(), id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Another category with this name already exists.' });
    }

    await pool.query(
      'UPDATE categories SET category_name = ?, description = ? WHERE id = ?',
      [category_name.trim(), description || '', id]
    );

    return res.json({ success: true, message: 'Category updated successfully.' });
  } catch (error) {
    console.error('updateCategory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if products exist in category
    const [inUse] = await pool.query('SELECT id FROM products WHERE category_id = ? LIMIT 1', [id]);
    if (inUse.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete this category because active product submissions are categorized under it.'
      });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
};
