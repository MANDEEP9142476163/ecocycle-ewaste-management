# EcoCycle – Smart Electronic Waste Management System

> **Academic SAI-III Society Internship Project**  
> **Topic:** Strategies of Electronic Waste Management  
> **Type:** Full-Stack Web Application (Production Ready)  

---

## 1. Project Overview

**EcoCycle** is an enterprise-grade digital platform engineered to bridge individual citizens who possess discarded or obsolete electronic items with certified e-waste recovery organizations, municipal inspectors, and recycling plants.

Electronic waste is the world's fastest-growing domestic waste stream, releasing hazardous heavy metals (lead, mercury, cadmium) into soil and aquifers when incinerated or dumped in informal landfills. EcoCycle provides an end-to-end, state-machine driven digital workflow to certify that every electronic device is inspected, collected, dismantled, and 100% recycled under zero-landfill protocols.

---

## 2. Key Features & Role Capabilities

### A. Public Citizen Portal (Citizen / Recycler)
- **Interactive Landing Page**: Modern visual design featuring environmental statistics, e-waste categories, environmental hazard analyses (Pb, Hg, Cd), and support contact forms.
- **Secure Registration & Auth**: JWT-based session security with bcrypt password encryption.
- **List E-Waste Products**: Multi-field submission including Brand, Model, Description, Expected Price, Preferred Pickup Date, Region (State & City), and dual-image uploads (front view & serial label).
- **Auto-Generated Product Code**: Formatted as `ECO-YYYY-XXXXX` (e.g. `ECO-2026-00001`).
- **Live 6-Stage Timeline**: Visual state tracker mapping:
  1. *Request Submitted*
  2. *Employee Assigned*
  3. *Under Investigation*
  4. *Doorstep Collection*
  5. *Sent for Recycling*
  6. *Recycling Completed*
- **Rejection Transparency**: Displays formal inspector rejection reasons prominently.
- **My Submissions & Search**: Filter and search through previously listed items.
- **Profile Management**: Update contact details and change security password.

### B. Field Officer Portal (Employee / Inspector)
- **Role Scoped Work Queue**: Field staff only have access to items officially assigned to them.
- **Field Investigation Desk**: Inspect physical device photos, user address, and contact numbers.
- **Accept Collection**: Record on-site verification, add condition remarks, capture collection date, and update status to `Collected`.
- **Reject Product**: Enforces a mandatory rejection justification that is permanently audited and visible to the user.
- **Recycling Plant Dispatch**: Advance collected items to `Sent for Recycling` with facility batch logistics.
- **Recycling Certification**: Confirm raw metal and polymer extraction, marking items as `Recycled`.
- **Search Assigned Requests**: Instant lookup by Product ID or citizen telephone.
- **Personal Profile**: Update contact phone number, hub location, and credentials.

### C. Administrator Console
- **Executive Analytics Dashboard**:
  - Live statistics across 10 critical operational metrics (Total Users, Staff, Products, Pending, Unassigned, Assigned, Collected, Sent for Recycling, Recycled, Rejected).
  - Monthly submission & collection bar charts.
  - Interactive lifecycle distribution donut charts.
  - Category breakdown visualizations.
- **Operating Location Setup**: Full CRUD management of States and associated Cities.
- **E-Waste Category Management**: Add, update, and manage categories and disposal descriptions.
- **Employee Management**: Register new field staff with auto-generated employee codes (`EMP001`), update details, deactivate accounts, and view assigned request queues.
- **Citizen Directory**: Inspect registered users and their submitted e-waste portfolios.
- **All Listed Products**: Central repository with multi-field search and filters.
- **Employee Assignment Desk**: Allocate pending product requests to active field officers with custom instructions.
- **Status Monitor**: Filter and review devices across all 7 operational lifecycle states.
- **Report Generator & CSV Export**: Filter products by date range, category, and lifecycle status; download downloadable CSV audit reports for academic and regulatory review.
- **Website CMS**: Live editing of public About Us and Contact Us pages.
- **Administrator Profile**: Update contact phone and change security password.

---

## 3. Technology Stack

- **Frontend**:
  - React 18
  - Vite
  - Tailwind CSS
  - React Router DOM v6
  - Axios (with JWT interceptors)
  - Lucide React Icons
  - Recharts (Analytical Charts)
  - React Hot Toast (Notifications)
- **Backend**:
  - Node.js & Express.js
  - RESTful Architecture
  - JSON Web Tokens (JWT)
  - bcryptjs (Password Hashing)
  - Multer (Local Image Storage & Filtering)
  - MySQL2 (Promise Connection Pool)
- **Database**:
  - MySQL 8.0
  - Database: `ewaste_management`
  - Normalized 3NF Schema with Foreign Keys, Cascading Rules, and Indexes.

---

## 4. Database Schema Overview

```sql
ewaste_management
├── users (id, full_name, email, mobile_number, password, created_at, updated_at)
├── admins (id, admin_name, username, email, mobile_number, password, created_at)
├── employees (id, employee_code, name, email, contact_number, address, password, status, joining_date, created_at)
├── states (id, state_name, created_at)
├── cities (id, state_id, city_name, created_at)
├── categories (id, category_name, description, created_at)
├── products (id, product_code, user_id, category_id, product_name, brand, model_type, description, expected_price, pickup_date, pickup_address, state_id, city_id, contact_person, contact_number, image_1, image_2, status, assigned_employee_id, created_at, updated_at)
├── tracking_history (id, product_id, employee_id, previous_status, new_status, remarks, updated_by, created_at)
├── pages (id, page_type, page_title, page_description, updated_at)
└── notifications (id, recipient_role, recipient_id, title, message, is_read, created_at)
```

---

## 5. Folder Structure

```
ewaste-management/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js     # Auth, profile, passwords
│   │   ├── categoryController.js # Category CRUD
│   │   ├── dashboardController.js# Admin, employee, user stats
│   │   ├── employeeController.js # Staff management
│   │   ├── locationController.js # States & cities
│   │   ├── notificationController.js # In-app alerts
│   │   ├── pageController.js     # CMS pages
│   │   ├── productController.js  # Product submissions & CRUD
│   │   ├── reportController.js   # Analytics & CSV exports
│   │   ├── userController.js     # Citizen management
│   │   └── workflowController.js # Assign, Investigate, Collect, Recycle, Reject
│   ├── database/
│   │   ├── schema.sql            # Table definitions & indexes
│   │   └── seed.js               # Seed script with demo accounts
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & role authorization
│   │   └── upload.js             # Multer image upload limits
│   ├── routes/                   # Modular Express routers
│   ├── utils/                    # Code generators & helpers
│   ├── uploads/                  # Uploaded device photos
│   ├── server.js                 # API entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global session state
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.jsx # Collapsible sidebar & header
│   │   │   ├── PublicNavbar.jsx  # Website header
│   │   │   └── PublicFooter.jsx  # Website footer
│   │   ├── pages/
│   │   │   ├── public/           # Landing, Login, Register
│   │   │   ├── admin/            # 14 Admin modules & reports
│   │   │   ├── employee/         # 7 Field officer modules
│   │   │   └── user/             # 6 Citizen recycling modules
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx# Role access guard
│   │   ├── services/
│   │   │   └── api.js            # Axios client with interceptors
│   │   ├── App.jsx               # Client route matrix
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind stylesheet
│   ├── index.html
│   ├── vite.config.js            # Proxy configuration
│   ├── tailwind.config.js        # Forest & Emerald theme palette
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## 6. Demo Login Credentials

For demonstration, academic assessment, or testing:

| Role | Portal / Login Page | Username / Email | Password |
| :--- | :--- | :--- | :--- |
| **Administrator** | `/login?role=admin` | `admin` (or `admin@ecocycle.org`) | `Admin@123` |
| **Field Officer** | `/login?role=employee` | `alex.mercer@ecocycle.org` (or `EMP001`) | `Employee@123` |
| **Citizen User** | `/login?role=user` | `user@ecocycle.org` | `User@123` |

> *Tip: The Login page includes **1-Click Demo Login** buttons that automatically populate credentials for each role.*

---

## 7. Installation & Quick Start Guide

### Prerequisites
1. **Node.js**: v18.0.0 or higher
2. **MySQL Server**: v8.0 or higher running on `localhost:3306`

---

### Step 1: Database Setup
1. Create the database and import schema:
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```
2. Seed initial data (categories, states, cities, demo accounts, and sample products):
   ```bash
   cd backend
   npm run seed
   ```

---

### Step 2: Backend Setup
1. Open terminal in `backend/`:
   ```bash
   cd backend
   npm install
   ```
2. Verify `.env` configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=ewaste_management
   JWT_SECRET=ecocycle_super_secure_jwt_secret_key_2026_sai_iii
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```
3. Start the API server:
   ```bash
   npm start
   # Or for auto-reload during development:
   npm run dev
   ```
   *The backend runs at `http://localhost:5000` with health check at `http://localhost:5000/api/health`.*

---

### Step 3: Frontend Setup
1. Open another terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 8. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a citizen account
- `POST /api/auth/login` - Authenticate admin, employee, or citizen
- `GET /api/auth/me` - Get current session profile
- `PUT /api/auth/profile` - Update user or employee profile
- `PUT /api/auth/change-password` - Verify and update password
- `POST /api/auth/logout` - Invalidate session

### Products & Workflow (`/api/products`)
- `POST /api/products` - Submit e-waste with 2 image attachments
- `GET /api/products` - List products (role scoped with search & filters)
- `GET /api/products/:id` - Complete product file with tracking history
- `POST /api/products/:id/assign` - Admin assigns product to employee
- `POST /api/products/:id/investigate` - Officer starts investigation
- `POST /api/products/:id/collect` - Officer marks item as collected
- `POST /api/products/:id/send-for-recycling` - Officer sends to recycling plant
- `POST /api/products/:id/complete-recycling` - Officer marks recycling completed
- `POST /api/products/:id/reject` - Officer rejects with mandatory reason

### Dashboards (`/api/dashboard`)
- `GET /api/dashboard/admin` - 10 KPI statistics, trends, and charts
- `GET /api/dashboard/employee` - Field tasks and queue
- `GET /api/dashboard/user` - Citizen recycling stats and recent items

### Reports (`/api/reports`)
- `GET /api/reports/products` - Filtered report summary
- `GET /api/reports/export-csv` - Direct CSV stream download

---

## 9. Quality Assurance & Verification Checklist

- [x] Full MySQL database connection & connection pooling.
- [x] Automatic product code generation (`ECO-2026-00001`).
- [x] Dual-photo upload with file-type and 5MB size limits.
- [x] Strict role-based route protection on frontend and backend.
- [x] Complete 6-stage lifecycle tracking with immutable audit trail.
- [x] Rejection mechanism requiring mandatory justification.
- [x] Dynamic dependent dropdowns (State -> City).
- [x] Recharts dynamic rendering of monthly trends and lifecycle breakdown.
- [x] Live CSV report streaming and export.
- [x] Responsive layout across Mobile, Tablet, and Desktop.
- [x] Production bundle build tested and verified (`npm run build`).

---

## 10. Academic Project Details

- **Project:** EcoCycle – Smart Electronic Waste Management System
- **Curriculum:** SAI-III Society Internship Project
- **Theme:** Strategies of Electronic Waste Management
- **Environment:** Node.js, Express, React, Vite, Tailwind CSS, MySQL
