const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function autoMigrate() {
  console.log('[AutoMigrate] Starting schema verification and safe migration...');
  try {
    // 1. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        mobile_number VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Admins Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_name VARCHAR(150) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(150) NOT NULL UNIQUE,
        mobile_number VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_admins_username (username),
        INDEX idx_admins_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Employees Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        contact_number VARCHAR(20) NOT NULL,
        address TEXT,
        password VARCHAR(255) NOT NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        joining_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employees_code (employee_code),
        INDEX idx_employees_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. States Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS states (
        id INT AUTO_INCREMENT PRIMARY KEY,
        state_name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Cities Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        state_id INT NOT NULL,
        city_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
        INDEX idx_cities_state_id (state_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Categories Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_code VARCHAR(50) NOT NULL UNIQUE,
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        brand VARCHAR(100),
        model_type VARCHAR(100),
        description TEXT,
        expected_price DECIMAL(10,2) DEFAULT 0.00,
        pickup_date DATE,
        pickup_address TEXT,
        state_id INT NULL,
        city_id INT NULL,
        contact_person VARCHAR(100),
        contact_number VARCHAR(20),
        image_1 VARCHAR(255),
        image_2 VARCHAR(255),
        status ENUM('Pending', 'Assigned', 'Under Investigation', 'Collected', 'Sent for Recycling', 'Recycled', 'Rejected') DEFAULT 'Pending',
        assigned_employee_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
        INDEX idx_products_code (product_code),
        INDEX idx_products_user (user_id),
        INDEX idx_products_status (status),
        INDEX idx_products_employee (assigned_employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Tracking History Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tracking_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        employee_id INT NULL,
        previous_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        remarks TEXT,
        updated_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
        INDEX idx_tracking_product (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. CMS Pages Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_type VARCHAR(50) NOT NULL UNIQUE,
        page_title VARCHAR(200) NOT NULL,
        page_description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Notifications Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_role ENUM('admin', 'employee', 'user') NOT NULL,
        recipient_id INT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_recipient (recipient_role, recipient_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('[AutoMigrate] All database tables verified / created.');

    // --- SAFE SEEDING (Only if records don't exist) ---

    // A. Categories
    const categories = [
      { name: 'Computers & Laptops', desc: 'Desktops, laptops, monitors, motherboards, servers, and processing units.' },
      { name: 'Mobile Phones & Tablets', desc: 'Smartphones, feature phones, phablets, iPads, and reading tablets.' },
      { name: 'Televisions & Displays', desc: 'CRT, LCD, LED, OLED monitors, TV screens, and projection displays.' },
      { name: 'Printers & Scanners', desc: 'Laser printers, inkjet printers, multi-function scanners, and fax devices.' },
      { name: 'Batteries & Power Units', desc: 'Lithium-ion batteries, laptop batteries, UPS units, lead-acid, and power packs.' },
      { name: 'Other Electronic Devices', desc: 'Routers, audio equipment, kitchen electronics, cables, smart accessories, and IoT devices.' }
    ];
    for (const cat of categories) {
      await pool.query(
        'INSERT IGNORE INTO categories (category_name, description) VALUES (?, ?)',
        [cat.name, cat.desc]
      );
    }

    // B. States & Cities
    const stateGroups = [
      { state: 'Bihar', cities: ['Bhagalpur', 'Patna', 'Gaya', 'Muzaffarpur', 'Darbhanga', 'Purnia'] },
      { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'] },
      { state: 'Delhi', cities: ['New Delhi', 'North Delhi', 'South Delhi', 'Dwarka'] },
      { state: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'] },
      { state: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Varanasi', 'Noida', 'Prayagraj'] },
      { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur'] }
    ];

    for (const group of stateGroups) {
      await pool.query('INSERT IGNORE INTO states (state_name) VALUES (?)', [group.state]);
      const [sRows] = await pool.query('SELECT id FROM states WHERE state_name = ?', [group.state]);
      if (sRows.length > 0) {
        const sId = sRows[0].id;
        for (const city of group.cities) {
          const [existing] = await pool.query('SELECT id FROM cities WHERE state_id = ? AND city_name = ?', [sId, city]);
          if (existing.length === 0) {
            await pool.query('INSERT INTO cities (state_id, city_name) VALUES (?, ?)', [sId, city]);
          }
        }
      }
    }

    // C. CMS Pages
    const pages = [
      {
        page_type: 'about_us',
        page_title: 'About EcoCycle',
        page_description: `EcoCycle is a leading smart electronic waste management and environmental recovery platform. Our mission is to eliminate hazardous e-waste from landfills and accelerate circular electronics recycling. 

Founded under the SAI-III Society Internship Project on "Strategies of Electronic Waste Management", EcoCycle bridges conscientious electronic owners with authorized recycling facilities, environmental auditors, and green disposal logistics. Every device collected undergoes thorough material recovery, responsible dismantling, and zero-landfill processing.`
      },
      {
        page_type: 'contact_us',
        page_title: 'Contact EcoCycle Support',
        page_description: `We are here to support your green journey. Reach out to our central operations team for pickup inquiries, institutional bulk e-waste recycling, or society partnership opportunities.

Operational Headquarters:
Indian Institute of Information Technology Bhagalpur
IIIT Bhagalpur, Bihar, India
Phone: +91 98765 43210
Email: ecocycle.project@gmail.com
Support Hours: Monday - Saturday, 9:00 AM - 6:00 PM IST`
      }
    ];

    for (const pg of pages) {
      await pool.query(
        `INSERT INTO pages (page_type, page_title, page_description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE page_title = VALUES(page_title), page_description = VALUES(page_description)`,
        [pg.page_type, pg.page_title, pg.page_description]
      );
    }

    // D. Admin Account: admin / Admin@123
    const [adminRows] = await pool.query('SELECT id, password FROM admins WHERE username = ?', ['admin']);
    if (adminRows.length === 0) {
      const adminHash = await bcrypt.hash('Admin@123', 10);
      await pool.query(
        `INSERT INTO admins (admin_name, username, email, mobile_number, password)
         VALUES (?, ?, ?, ?, ?)`,
        ['System Administrator', 'admin', 'admin@ecocycle.org', '+91 98765 43210', adminHash]
      );
      console.log('[AutoMigrate] Demo Admin account created: admin / Admin@123');
    } else {
      const isMatch = await bcrypt.compare('Admin@123', adminRows[0].password);
      if (!isMatch) {
        const adminHash = await bcrypt.hash('Admin@123', 10);
        await pool.query('UPDATE admins SET password = ? WHERE id = ?', [adminHash, adminRows[0].id]);
        console.log('[AutoMigrate] Demo Admin password synchronized to Admin@123');
      }
    }

    // E. Employee Account: alex.mercer@ecocycle.org / Employee@123
    const [empRows] = await pool.query('SELECT id, password FROM employees WHERE employee_code = ? OR email = ?', ['EMP001', 'alex.mercer@ecocycle.org']);
    let emp1Id;
    if (empRows.length === 0) {
      const empHash = await bcrypt.hash('Employee@123', 10);
      const [res1] = await pool.query(
        `INSERT INTO employees (employee_code, name, email, contact_number, address, password, status, joining_date)
         VALUES (?, ?, ?, ?, ?, ?, 'Active', '2025-01-15')`,
        ['EMP001', 'Alex Mercer', 'alex.mercer@ecocycle.org', '+91 98765 43211', 'IIIT Bhagalpur Campus, Bihar, India', empHash]
      );
      emp1Id = res1.insertId;

      await pool.query(
        `INSERT INTO employees (employee_code, name, email, contact_number, address, password, status, joining_date)
         VALUES (?, ?, ?, ?, ?, ?, 'Active', '2025-03-01')`,
        ['EMP002', 'Sarah Jenkins', 'sarah.j@ecocycle.org', '+91 98765 43212', 'IIIT Bhagalpur Depot, Bihar, India', empHash]
      );
      console.log('[AutoMigrate] Demo Employee account created: alex.mercer@ecocycle.org / Employee@123');
    } else {
      emp1Id = empRows[0].id;
      const isMatch = await bcrypt.compare('Employee@123', empRows[0].password);
      if (!isMatch) {
        const empHash = await bcrypt.hash('Employee@123', 10);
        await pool.query('UPDATE employees SET password = ? WHERE id = ?', [empHash, emp1Id]);
        console.log('[AutoMigrate] Demo Employee password synchronized to Employee@123');
      }
    }

    // F. User Account: user@ecocycle.org / User@123
    const [userRows] = await pool.query('SELECT id, password FROM users WHERE email = ?', ['user@ecocycle.org']);
    let sampleUserId;
    if (userRows.length === 0) {
      const userHash = await bcrypt.hash('User@123', 10);
      const [uRes] = await pool.query(
        `INSERT INTO users (full_name, email, mobile_number, password)
         VALUES (?, ?, ?, ?)`,
        ['Rahul Kumar', 'user@ecocycle.org', '+91 98765 43210', userHash]
      );
      sampleUserId = uRes.insertId;
      console.log('[AutoMigrate] Demo User account created: user@ecocycle.org / User@123');
    } else {
      sampleUserId = userRows[0].id;
      const isMatch = await bcrypt.compare('User@123', userRows[0].password);
      if (!isMatch) {
        const userHash = await bcrypt.hash('User@123', 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [userHash, sampleUserId]);
        console.log('[AutoMigrate] Demo User password synchronized to User@123');
      }
    }

    // G. Sample Products (only if products table is empty)
    const [prodCount] = await pool.query('SELECT COUNT(*) as count FROM products');
    if (prodCount[0].count === 0 && sampleUserId) {
      const [catRows] = await pool.query('SELECT id, category_name FROM categories');
      const catMap = {};
      catRows.forEach(c => { catMap[c.category_name] = c.id; });

      const [stateRows] = await pool.query('SELECT id FROM states WHERE state_name = ?', ['Bihar']);
      const biharId = stateRows[0]?.id || null;
      const [cityRows] = await pool.query('SELECT id FROM cities WHERE city_name = ?', ['Bhagalpur']);
      const bgpId = cityRows[0]?.id || null;

      const sampleProducts = [
        {
          code: 'ECO-2026-00001',
          name: 'Dell Inspiron 15 5000 Laptop',
          cat: catMap['Computers & Laptops'] || 1,
          brand: 'Dell',
          model: 'Inspiron 5570',
          desc: 'Old 15-inch laptop with cracked screen and failing HDD. Motherboard and RAM intact.',
          price: 4500.00,
          date: '2026-11-20',
          addr: 'IIIT Bhagalpur Campus, Sabour',
          person: 'Rahul Kumar',
          phone: '+91 98765 43210',
          status: 'Collected',
          empId: emp1Id
        },
        {
          code: 'ECO-2026-00002',
          name: 'Samsung 55-inch Curved Smart TV',
          cat: catMap['Televisions & Displays'] || 3,
          brand: 'Samsung',
          model: 'UN55KU6500FXZA',
          desc: 'Powers on with horizontal colored backlight lines across display panel.',
          price: 3200.00,
          date: '2026-11-22',
          addr: 'Station Road, Bhagalpur',
          person: 'Rahul Kumar',
          phone: '+91 98765 43210',
          status: 'Assigned',
          empId: emp1Id
        },
        {
          code: 'ECO-2026-00003',
          name: 'HP LaserJet Pro MFP M428fdw',
          cat: catMap['Printers & Scanners'] || 4,
          brand: 'HP',
          model: 'M428fdw',
          desc: 'Office laser printer with recurrent paper jam and roller wear. Includes partial toner cartridge.',
          price: 2500.00,
          date: '2026-11-25',
          addr: 'Tilka Manjhi Chowk, Bhagalpur',
          person: 'Rahul Kumar',
          phone: '+91 98765 43210',
          status: 'Pending',
          empId: null
        },
        {
          code: 'ECO-2026-00004',
          name: 'iPhone 11 64GB & iPad Mini 2',
          cat: catMap['Mobile Phones & Tablets'] || 2,
          brand: 'Apple',
          model: 'A2111 / A1489',
          desc: 'iPhone with depleted battery (68% health) and iPad Mini with cracked digitizer.',
          price: 5500.00,
          date: '2026-11-10',
          addr: 'Zero Mile, Bhagalpur',
          person: 'Rahul Kumar',
          phone: '+91 98765 43210',
          status: 'Recycled',
          empId: emp1Id
        }
      ];

      for (const p of sampleProducts) {
        const [pRes] = await pool.query(
          `INSERT INTO products (
            product_code, user_id, category_id, product_name, brand, model_type,
            description, expected_price, pickup_date, pickup_address, state_id, city_id,
            contact_person, contact_number, status, assigned_employee_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.code, sampleUserId, p.cat, p.name, p.brand, p.model,
            p.desc, p.price, p.date, p.addr, biharId, bgpId,
            p.person, p.phone, p.status, p.empId
          ]
        );
        const prodId = pRes.insertId;

        await pool.query(
          `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
           VALUES (?, NULL, NULL, 'Pending', 'Initial product request submitted by user.', 'Rahul Kumar (User)')`,
          [prodId]
        );

        if (p.status !== 'Pending' && p.empId) {
          await pool.query(
            `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
             VALUES (?, ?, 'Pending', 'Assigned', 'Product assigned to Alex Mercer for investigation.', 'Admin')`,
            [prodId, p.empId]
          );
        }

        if (p.status === 'Collected' || p.status === 'Sent for Recycling' || p.status === 'Recycled') {
          await pool.query(
            `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
             VALUES (?, ?, 'Assigned', 'Collected', 'Device verified on-site. Physical inspection completed and item collected.', 'Alex Mercer (EMP001)')`,
            [prodId, p.empId]
          );
        }

        if (p.status === 'Recycled') {
          await pool.query(
            `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
             VALUES (?, ?, 'Collected', 'Sent for Recycling', 'Dispatched to e-waste recovery center batch #REC-884.', 'Alex Mercer (EMP001)')`,
            [prodId, p.empId]
          );
          await pool.query(
            `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
             VALUES (?, ?, 'Sent for Recycling', 'Recycled', 'Complete dismantling, copper/lithium separation, and responsible recycling certified.', 'Alex Mercer (EMP001)')`,
            [prodId, p.empId]
          );
        }
      }
      console.log('[AutoMigrate] Sample products seeded.');
    }

    console.log('[AutoMigrate] Database verification and migration completed successfully.');
    return { success: true, message: 'Database schema and initial seed verified successfully.' };
  } catch (error) {
    console.error('[AutoMigrate] Migration error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { autoMigrate };
