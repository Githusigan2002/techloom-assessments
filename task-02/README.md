# Mini Storefront & Inventory Reservation System
---
### Project Links

* **Frontend Live Deployment:** [https://techloom-assessments-task02-fronete.vercel.app/](https://techloom-assessments-task02-fronete.vercel.app/)
* **Backend API Live Deployment:** [https://techloom-assessments-task02-backend.vercel.app/](https://techloom-assessments-task02-backend.vercel.app/)
* **GitHub Repository:** [https://github.com/Githusigan2002/techloom-assessments/tree/main/task-02](https://github.com/Githusigan2002/techloom-assessments/tree/main/task-02)

---

## Overview

A responsive full-stack e-commerce storefront engineered with atomic inventory control and resilient checkout flows. The system supports both **Guest Sessions** and **Authenticated Users**, featuring **5-minute atomic stock reservations**, **mock payment gateway simulation** (`SUCCESS`, `FAILURE`, `TIMEOUT`), **idempotent payment submission**, **concurrency-safe inventory management**, and **automated stock restoration on cancellation or expiration**.

---

## Tech Stack

### Backend
* **Runtime & Framework:** Node.js (CommonJS), Express.js
* **Database & ODM:** MongoDB Atlas, Mongoose
* **Concurrency & Inventory Guard:** Atomic MongoDB conditional updates (`$expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, quantity] }`) to prevent overselling under concurrent checkouts
* **Authentication & Security:** JSON Web Tokens (JWT), bcryptjs password hashing, guest session tracking via `x-session-id`
* **Logging & Middleware:** Morgan HTTP logger, CORS middleware with Vercel deployment support, centralized error handling

### Frontend
* **Core:** React 19, JavaScript
* **Build Tool:** Vite
* **Styling:** Vanilla CSS with custom design system, modern glassmorphism, responsive navigation, and modal dialogues
* **Routing:** React Router v7
* **HTTP Client:** Axios instance with automatic token attachment, session ID header injection, and response interceptors

---

## Architecture & Concurrency Highlights

* **Atomic Conditional Stock Reservation:**  
  When checkout begins, items are locked using atomic MongoDB updates:
  ```javascript
  await Product.findOneAndUpdate(
    {
      _id: productId,
      $expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, quantity] },
    },
    { $inc: { reservedStock: quantity } },
    { new: true }
  );
  ```
  If any item in the order lacks sufficient unreserved stock, any partially reserved items are rolled back immediately.

* **5-Minute Reservation Expiry:**  
  Orders placed in checkout are marked with a `reservationExpiresAt` timestamp (now + 5 minutes). A background sweeper periodically releases any expired reservations, returning the reserved units back to the available pool.

* **Idempotent Payment Processing:**  
  Payment requests accept an `idempotencyKey` to prevent duplicate submissions or accidental double charges from multiple clicks or retried requests.

* **Lifecycle Stock Transitions:**
  - **Checkout Created:** `reservedStock` increments; physical `stock` is unchanged.
  - **Payment Success:** `stock` decreases, `reservedStock` decreases, order status becomes `paid`.
  - **Payment Failure / Timeout:** `reservedStock` is released back to available inventory; order status becomes `cancelled`.
  - **Order Cancellation / Refund:** Sold items are returned to inventory by incrementing physical `stock`.

---

## Environment Variables

### Backend (`task-02/Backend/.env`)
Create a `.env` file inside the `task-02/Backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI="your_mongodb_connection_string"
CLIENT_URL=http://localhost:5173
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN=1d
```

### Frontend (`task-02/Frontend/.env`)
Create a `.env` file inside the `task-02/Frontend/` directory:

```env
# For local development:
VITE_API_URL=http://localhost:5000/api

# For production deployment:
# VITE_API_URL=https://techloom-assessments-task02-backend.vercel.app/api
```

---

## Setup & Installation Steps

### Prerequisites
* **Node.js:** v18.x or higher
* **npm:** v9.x or higher
* **MongoDB:** Local MongoDB instance or MongoDB Atlas cluster

### Step 1: Clone the Repository
```bash
git clone https://github.com/Githusigan2002/techloom-assessments.git
cd techloom-assessments/task-02
```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Start backend server (seeds sample product catalog on first connection)
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### Step 3: Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd Frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## How to Test Features

### 1. Browse & Filter Products
1. Open the storefront at `http://localhost:5173` (or the live URL).
2. Filter products by category (e.g., *Accessories*, *Keyboards*, *Audio*, *Displays*).
3. Search by product name or description.
4. Click on any product card to view detailed specifications, stock levels, and price.

### 2. Guest Cart & User Authentication
1. Add items to cart as a guest — the cart persists using the generated `x-session-id`.
2. Click **Sign In / Register** in the top navigation.
3. Create a new user account with your name, email, and password.
4. Sign in to view and manage your account and associated order history.

### 3. Checkout & 5-Minute Reservation
1. Navigate to the **Cart** page and click **Proceed to Checkout**.
2. An atomic reservation is created for your items, locking the requested quantity.
3. The checkout page displays an active **5-minute live countdown timer**.
4. If you leave or refresh the page before the timer expires, the reservation remains held for your session.

### 4. Mock Payment Scenarios
On the checkout payment screen, select any payment outcome to test system behavior:
* **Success:** Order transitions to `paid`, stock is permanently deducted, and you are redirected to the **Order Confirmation** page.
* **Failure:** Payment fails immediately, reserved stock is released back into available inventory, and order status updates to `cancelled`.
* **Timeout:** Simulates a payment gateway timeout, releasing reservations gracefully.

### 5. Order Management & Cancellation
1. Visit the **Orders** page (`/orders`) to view past orders and transaction statuses.
2. Click an individual order to inspect order breakdown, payment details, and shipping address.
3. Click **Cancel Order** to cancel a paid or pending order; stock is automatically restored to the product inventory.

---

## API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and timestamp |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Log in and receive JWT token |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile |
| `POST` | `/api/auth/logout` | Invalidate user session |
| `GET` | `/api/products` | Get list of products with optional search and category filters |
| `GET` | `/api/products/:id` | Get single product details |
| `GET` | `/api/cart` | Get cart contents for active session / user |
| `POST` | `/api/cart/items` | Add item to cart |
| `PUT` | `/api/cart/items/:productId` | Update item quantity in cart |
| `DELETE`| `/api/cart/items/:productId` | Remove item from cart |
| `DELETE`| `/api/cart` | Clear entire cart |
| `POST` | `/api/checkout/reserve` | Create order and atomically reserve stock (starts 5-min timer) |
| `POST` | `/api/checkout/pay` | Process payment with mock outcome (`SUCCESS`, `FAILURE`, `TIMEOUT`) |
| `GET` | `/api/orders` | Retrieve user order history |
| `GET` | `/api/orders/:id` | Retrieve single order details |
| `POST` | `/api/orders/:id/cancel` | Cancel order and restore inventory |
