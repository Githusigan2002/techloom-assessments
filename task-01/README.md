# POS Order & Inventory Management System
---
### Project Links

* **Frontend Live Deployment:** [https://techloom-assessments-task01-fronten.vercel.app/](https://techloom-assessments-task01-fronten.vercel.app/)
* **Backend API Live Deployment:** [https://techloom-assessments-task01-backend.vercel.app/](https://techloom-assessments-task01-backend.vercel.app/)
* **GitHub Repository:** [https://github.com/Githusigan2002/techloom-assessments/tree/main/task-01](https://github.com/Githusigan2002/techloom-assessments/tree/main/task-01)

#### Demo Accounts
| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@pos.com` | `password123` | Full access: Admin Dashboard, Products CRUD, Stock adjustments, View all customer orders |
| **Customer** | `cashier@pos.com` (or Register new user) | `password123` | Customer Storefront: Catalog, Details, Cart, 5-Min Reservation Checkout, Order History |

---

## Overview

A customer-facing online store and POS system engineered for high-concurrency e-commerce operations. Built to demonstrate resilient inventory control, the system features **5-minute atomic stock reservations**, **mock payment gateway simulation** (`SUCCESS`, `FAILED`, `TIMEOUT`), **idempotent payment submission**, **zero-overselling concurrency protection**, and **automatic stock restoration on order cancellation**.

All prices throughout the application are displayed in **Sri Lankan Rupees (Rs. / LKR)**.

---

## Tech Stack

### Backend
* **Runtime & Framework:** Node.js (ES Modules), Express.js
* **Database & ODM:** MongoDB Atlas, Mongoose
* **Transactions & Concurrency:** MongoDB ACID Multi-Document Transactions (`session.startTransaction()`) & Atomic Conditional Updates (`$gte` filters)
* **Authentication & Security:** JSON Web Tokens (JWT), bcryptjs password hashing
* **Background Workers:** Node.js 10-second interval cron for automatic reservation expiry

### Frontend
* **Core:** React 19, JavaScript (No TypeScript)
* **Build Tool:** Vite
* **Styling:** Tailwind CSS (Practical, professional POS design without generic AI gradients)
* **Routing:** React Router v7
* **HTTP Client:** Axios with automatic JWT interceptors

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGODB_URI="your_mongodb_connection_string"
JWT_SECRET="your_secret_key_here"
JWT_EXPIRES_IN=1d
```

### Frontend (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_URL="http://localhost:5000/api"
```
*(For production, set `VITE_API_URL` to your live deployed backend API URL e.g. `https://your-backend.onrender.com/api`)*

---

## Setup & Installation Steps

### Prerequisites
* **Node.js:** v18.x or higher
* **npm:** v9.x or higher
* **MongoDB:** Local MongoDB instance or MongoDB Atlas cluster connection string

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/techloom-assessment.git
cd techloom-assessment/task-01
```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Ensure your backend/.env has your valid MONGODB_URI and JWT_SECRET

# (Optional) Seed default admin and cashier accounts
node src/seed_accounts.js

# Start backend development server
npm run dev
```
*Backend runs on `http://localhost:5000` with automated background expiry job active.*

### Step 3: Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### Step 4: Run Automated Concurrency & Lifecycle Tests
```bash
cd backend
npm test
```
*Executes the complete test suite verifying zero overselling across 10 concurrent requests, idempotency replays, stock cancellation, and payment failure restoration.*

---

## How to Test Each Feature

### 1. Product Discovery & Filtering
1. Log into the store or register a new account.
2. Go to **Products** (`/products`).
3. **Search:** Type a product name or SKU into the search box. Notice the debounced real-time filter.
4. **Category Filter:** Filter by specific categories using the dropdown.
5. **Price Filter:** Enter Min and Max prices in **Rs.** (e.g. Min: `100`, Max: `500`) to narrow results.
6. **Availability Filter:** Check **"In Stock Only"** to hide sold-out items.
7. Click **"Reset Filters"** to clear all criteria.
8. Click any product name or the **"Details"** button to open the **Product Details View** (`/products/:id`) showing full description, available stock vs reserved stock, and quantity picker.

---

### 2. Cart & 5-Minute Atomic Stock Reservation
1. On any product, select a quantity and click **"Add to Cart"**.
2. Open **Shopping Cart** (`/cart`).
3. Adjust quantities using the `+` / `-` buttons. Notice the client and server block quantities greater than `availableStock`.
4. Click **"Proceed to Checkout →"**:
   * Stock is atomically locked in MongoDB (`availableStock: -qty`, `reservedStock: +qty`).
   * The cart is emptied.
   * You are taken directly to `/checkout` where a live **5-minute countdown timer (`05:00`)** begins ticking down immediately.
   * If you reload the page, the active reservation is restored with the exact remaining seconds.

---

### 3. Mock Payment Gateway (Success, Failure, Timeout)
On the `/checkout` page:
* **Test Case A: Successful Payment (`SUCCESS`)**
  1. Select outcome radio **"Success"**.
  2. Click **"Pay Rs. XXX.XX"**.
  3. The payment is recorded (`COMPLETED`), the order transitions to `PAID`, and physical `stock` is permanently deducted.
* **Test Case B: Payment Failure (`FAILED`)**
  1. Checkout another cart and select **"Failure"**.
  2. Click the pay button.
  3. Order transitions to `FAILED`, and the held stock is **immediately returned to available inventory**.
* **Test Case C: Gateway Timeout (`TIMEOUT`)**
  1. Select **"Timeout"** and submit.
  2. Order transitions to `EXPIRED`, and reserved stock is released.
* **Test Case D: Natural 5-Minute Expiry**
  1. Reserve an order and wait until the 5-minute timer hits `00:00` (or let the 10-second backend worker scan).
  2. The background job automatically restores available stock and sets order status to `EXPIRED`.

---

### 4. Duplicate Submission & Idempotency
* Both the checkout API (`POST /api/orders/checkout`) and payment API (`POST /api/payments/process`) require/generate an `idempotencyKey`.
* Resending the same payload with the identical key returns the original transaction and order status without creating duplicate orders, double-charging, or deducting stock twice.
* Verified in automated tests (`backend/src/tests/concurrency.test.js`).

---

### 5. Concurrency Safety (Zero Overselling Under Load)
To test simultaneous checkout requests:
1. Open a terminal in `backend/`.
2. Run:
   ```bash
   npm test
   ```
3. The test creates a product with **strictly 3 items in stock** and fires **10 checkout requests simultaneously** using `Promise.all()` from 10 distinct buyer tokens.
4. **Result:** Exactly 3 succeed (`201 Created`), 7 are rejected with `400 Insufficient Stock`, and `availableStock` ends at exactly `0`. Zero overselling guaranteed.

---

### 6. Post-Purchase Flow & Cancellation / Refund
1. Navigate to **My Orders** (`/orders`) to see all your past transactions and real-time statuses.
2. Click **"View"** on any order to open **Order Details** (`/orders/:id`).
3. Click **"Cancel Order"**:
   * If the order is `RESERVED`, the held reservation is released back to available stock.
   * If the order was `PAID`, physical stock is restored to store inventory and the status transitions to `CANCELLED`.

---

### 7. Admin Dashboard & Inventory Management
1. Log in with Admin credentials (`admin@pos.com` / `password123`).
2. **Dashboard (`/admin`):** View total products, low stock alerts, pending reservations, and total paid transactions.
3. **Products (`/admin/products`):** View complete catalog table, edit products, or create new products with custom SKU, category, and price in Rs.
4. **Inventory (`/admin/inventory`):** Adjust stock levels in real time (Add, Reduce, Set) and inspect active reservation locks.
5. **Orders (`/admin/orders`):** View all orders placed across all customers in the system, filter by status (`PAID`, `RESERVED`, etc.), and view individual customer transaction receipts.

---

## 🏛️ Architecture & Concurrency Highlights

* **Atomic Stock Deduction:** Avoids read-modify-write race conditions by executing conditional atomic updates directly inside MongoDB:
  ```javascript
  await Product.findOneAndUpdate(
    { _id: productId, availableStock: { $gte: quantity } },
    { $inc: { availableStock: -quantity, reservedStock: quantity } }
  );
  ```
* **ACID Transactions:** Checkout operations wrap stock reservation, order creation, and cart emptying within a `mongoose.startSession()` transaction, automatically aborting on failure or retrying on transient write conflicts.
* **Double-Release Guard:** Releasing or expiring stock checks `{ _id: reservationId, status: "ACTIVE" }` atomically, preventing duplicate stock restoration.