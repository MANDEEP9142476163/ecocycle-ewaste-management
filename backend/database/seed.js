const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  console.log('[Seed] Starting database seeding...');
  try {
    // 1. Seed States
    const states = [
      'Bihar', 'Maharashtra', 'Delhi', 'Karnataka', 'Uttar Pradesh',
      'West Bengal', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Telangana'
    ];
    for (const state of states) {
      await pool.query(
        'INSERT IGNORE INTO states (state_name) VALUES (?)',
        [state]
      );
    }
    console.log('[Seed] States seeded.');

    // Get state ids
    const [stateRows] = await pool.query('SELECT id, state_name FROM states');
    const stateMap = {};
    stateRows.forEach(r => { stateMap[r.state_name] = r.id; });

    // 2. Seed Cities
    const cityList = [
      { state: 'Bihar', cities: ['Bhagalpur', 'Patna', 'Gaya', 'Muzaffarpur', 'Darbhanga', 'Purnia'] },
      { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'] },
      { state: 'Delhi', cities: ['New Delhi', 'North Delhi', 'South Delhi', 'Dwarka'] },
      { state: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'] },
      { state: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Varanasi', 'Noida', 'Prayagraj'] },
      { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur'] }
    ];

    for (const group of cityList) {
      const sId = stateMap[group.state];
      if (sId) {
        for (const city of group.cities) {
          const [existing] = await pool.query('SELECT id FROM cities WHERE state_id = ? AND city_name = ?', [sId, city]);
          if (existing.length === 0) {
            await pool.query('INSERT INTO cities (state_id, city_name) VALUES (?, ?)', [sId, city]);
          }
        }
      }
    }
    console.log('[Seed] Cities seeded.');

    // 3. Seed Categories
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
    console.log('[Seed] Categories seeded.');

    // 4. Seed Admin
    const [adminCheck] = await pool.query('SELECT id FROM admins WHERE username = ?', ['admin']);
    if (adminCheck.length === 0) {
      const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
      await pool.query(
        `INSERT INTO admins (admin_name, username, email, mobile_number, password)
         VALUES (?, ?, ?, ?, ?)`,
        ['System Administrator', 'admin', 'admin@ecocycle.org', '+91 98765 43210', adminPasswordHash]
      );
      console.log('[Seed] Initial Admin seeded: admin / Admin@123');
    }

    // 5. Seed Employees
    const [empCheck] = await pool.query('SELECT id FROM employees WHERE employee_code = ?', ['EMP001']);
    let emp1Id;
    if (empCheck.length === 0) {
      const empPasswordHash = await bcrypt.hash('Employee@123', 10);
      const [result1] = await pool.query(
        `INSERT INTO employees (employee_code, name, email, contact_number, address, password, status, joining_date)
         VALUES (?, ?, ?, ?, ?, ?, 'Active', '2025-01-15')`,
        ['EMP001', 'Alex Mercer', 'alex.mercer@ecocycle.org', '+91 98765 43211', 'IIIT Bhagalpur Campus, Bihar, India', empPasswordHash]
      );
      emp1Id = result1.insertId;

      await pool.query(
        `INSERT INTO employees (employee_code, name, email, contact_number, address, password, status, joining_date)
         VALUES (?, ?, ?, ?, ?, ?, 'Active', '2025-03-01')`,
        ['EMP002', 'Sarah Jenkins', 'sarah.j@ecocycle.org', '+91 98765 43212', 'IIIT Bhagalpur Depot, Bihar, India', empPasswordHash]
      );
      console.log('[Seed] Employees seeded: EMP001 (alex.mercer@ecocycle.org / Employee@123), EMP002');
    } else {
      emp1Id = empCheck[0].id;
    }

    // 6. Seed User
    const [userCheck] = await pool.query('SELECT id FROM users WHERE email = ?', ['user@ecocycle.org']);
    let sampleUserId;
    if (userCheck.length === 0) {
      const userPasswordHash = await bcrypt.hash('User@123', 10);
      const [uRes] = await pool.query(
        `INSERT INTO users (full_name, email, mobile_number, password)
         VALUES (?, ?, ?, ?)`,
        ['David Miller', 'user@ecocycle.org', '+91 98765 43210', userPasswordHash]
      );
      sampleUserId = uRes.insertId;
      console.log('[Seed] Sample User seeded: user@ecocycle.org / User@123');
    } else {
      sampleUserId = userCheck[0].id;
    }

    // 7. Seed CMS Pages
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
    console.log('[Seed] CMS Pages seeded.');

    // 8. Seed sample products & tracking history if table is empty
    const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
    if (productCount[0].count === 0 && sampleUserId) {
      const [catRows] = await pool.query('SELECT id, category_name FROM categories');
      const catMap = {};
      catRows.forEach(c => { catMap[c.category_name] = c.id; });

      const biharStateId = stateMap['Bihar'] || null;
      const [bgpCity] = await pool.query('SELECT id FROM cities WHERE city_name = ?', ['Bhagalpur']);
      const bgpCityId = bgpCity[0]?.id || null;

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
            p.desc, p.price, p.date, p.addr, biharStateId, bgpCityId,
            p.person, p.phone, p.status, p.empId
          ]
        );
        const prodId = pRes.insertId;

        // Add tracking history
        await pool.query(
          `INSERT INTO tracking_history (product_id, employee_id, previous_status, new_status, remarks, updated_by)
           VALUES (?, NULL, NULL, 'Pending', 'Initial product request submitted by user.', 'David Miller (User)')`,
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
      console.log('[Seed] Sample products and tracking history seeded.');
    }

    console.log('[Seed] Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
}

seed();
