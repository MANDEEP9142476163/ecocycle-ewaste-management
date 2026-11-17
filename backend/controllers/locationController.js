const { pool } = require('../config/db');

// State Controllers
exports.getAllStates = async (req, res) => {
  try {
    const [states] = await pool.query(
      `SELECT s.id, s.state_name, s.created_at,
              COUNT(c.id) as city_count
       FROM states s
       LEFT JOIN cities c ON s.id = c.state_id
       GROUP BY s.id
       ORDER BY s.state_name ASC`
    );
    return res.json({ success: true, states });
  } catch (error) {
    console.error('getAllStates error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch states.' });
  }
};

exports.createState = async (req, res) => {
  try {
    const { state_name } = req.body;
    if (!state_name || !state_name.trim()) {
      return res.status(400).json({ success: false, message: 'State name is required.' });
    }

    const [existing] = await pool.query('SELECT id FROM states WHERE state_name = ?', [state_name.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'State already exists.' });
    }

    const [result] = await pool.query('INSERT INTO states (state_name) VALUES (?)', [state_name.trim()]);
    return res.status(201).json({
      success: true,
      message: 'State added successfully.',
      stateId: result.insertId
    });
  } catch (error) {
    console.error('createState error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create state.' });
  }
};

exports.updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { state_name } = req.body;

    if (!state_name || !state_name.trim()) {
      return res.status(400).json({ success: false, message: 'State name is required.' });
    }

    const [existing] = await pool.query('SELECT id FROM states WHERE state_name = ? AND id != ?', [state_name.trim(), id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Another state with this name already exists.' });
    }

    await pool.query('UPDATE states SET state_name = ? WHERE id = ?', [state_name.trim(), id]);
    return res.json({ success: true, message: 'State updated successfully.' });
  } catch (error) {
    console.error('updateState error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update state.' });
  }
};

exports.deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM states WHERE id = ?', [id]);
    return res.json({ success: true, message: 'State deleted successfully.' });
  } catch (error) {
    console.error('deleteState error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete state.' });
  }
};

// City Controllers
exports.getCities = async (req, res) => {
  try {
    const { state_id } = req.query;
    let query = `
      SELECT c.id, c.city_name, c.state_id, s.state_name, c.created_at
      FROM cities c
      JOIN states s ON c.state_id = s.id
    `;
    const params = [];

    if (state_id) {
      query += ` WHERE c.state_id = ?`;
      params.push(state_id);
    }

    query += ` ORDER BY s.state_name ASC, c.city_name ASC`;

    const [cities] = await pool.query(query, params);
    return res.json({ success: true, cities });
  } catch (error) {
    console.error('getCities error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch cities.' });
  }
};

exports.createCity = async (req, res) => {
  try {
    const { state_id, city_name } = req.body;
    if (!state_id || !city_name || !city_name.trim()) {
      return res.status(400).json({ success: false, message: 'State and city name are required.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM cities WHERE state_id = ? AND city_name = ?',
      [state_id, city_name.trim()]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'City already exists under this state.' });
    }

    const [result] = await pool.query(
      'INSERT INTO cities (state_id, city_name) VALUES (?, ?)',
      [state_id, city_name.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'City added successfully.',
      cityId: result.insertId
    });
  } catch (error) {
    console.error('createCity error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create city.' });
  }
};

exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { state_id, city_name } = req.body;

    if (!city_name || !city_name.trim()) {
      return res.status(400).json({ success: false, message: 'City name is required.' });
    }

    await pool.query(
      'UPDATE cities SET state_id = ?, city_name = ? WHERE id = ?',
      [state_id, city_name.trim(), id]
    );

    return res.json({ success: true, message: 'City updated successfully.' });
  } catch (error) {
    console.error('updateCity error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update city.' });
  }
};

exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cities WHERE id = ?', [id]);
    return res.json({ success: true, message: 'City deleted successfully.' });
  } catch (error) {
    console.error('deleteCity error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete city.' });
  }
};
