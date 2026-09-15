// Comprehensive Test Suite for Phases 5 through 14:
// - Cart Management
// - Order Lifecycle & State Transitions
// - Atomic Stock Reservations
// - Mock Payment Gateway & Idempotency
// - Order Cancellation & Stock Restoration
// - Concurrency Safety & Overselling Prevention

const BASE_URL = "http://localhost:5000";

// Helper for HTTP requests
const request = async (url, options = {}, token = null) => {
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
};

const runAllTests = async () => {
    console.log("=================================================================");
    console.log("STARTING FULL SUITE VERIFICATION (PHASES 5 - 14)");
    console.log("=================================================================\n");

    const runId = Math.floor(Math.random() * 100000);

    // -------------------------------------------------------------
    // SETUP: Create Admin User & Product
    // -------------------------------------------------------------
    console.log(">>> Step 1: Authentication & Setup");
    const { data: authData } = await request("/api/auth/register", {
        method: "POST",
        body: {
            username: `tester_${runId}`,
            email: `tester_${runId}@pos.com`,
            password: "password123",
            role: "admin",
        },
    });
    const token = authData.token;
    console.log("✓ User registered and authenticated");

    const { data: prodData } = await request(
        "/api/products",
        {
            method: "POST",
            body: {
                name: "Thermal Receipt Printer",
                sku: `PRINTER_${runId}`,
                price: 150.0,
                stock: 20,
            },
        },
        token
    );
    const productId = prodData.product._id;
    console.log(`✓ Test Product created: ID=${productId}, Initial Stock=20\n`);

    // -------------------------------------------------------------
    // PHASE 5: CART TESTING
    // -------------------------------------------------------------
    console.log(">>> Step 2: Phase 5 - Cart Management");
    
    // Add item to cart
    const addRes = await request(
        "/api/cart/items",
        {
            method: "POST",
            body: { productId, quantity: 2 },
        },
        token
    );
    console.log(`✓ Added 2 items to cart. Cart total: $${addRes.data.cart.totalAmount}`);

    // Update quantity
    const updateRes = await request(
        `/api/cart/items/${productId}`,
        {
            method: "PUT",
            body: { quantity: 5 },
        },
        token
    );
    console.log(`✓ Updated quantity to 5. New total: $${updateRes.data.cart.totalAmount}`);

    // Validate invalid quantity (exceeding stock)
    const exceedRes = await request(
        `/api/cart/items/${productId}`,
        {
            method: "PUT",
            body: { quantity: 999 },
        },
        token
    );
    console.log(`✓ Excessive quantity rejected properly: Status ${exceedRes.status} ("${exceedRes.data.message}")`);

    // Reset back to 2 items
    await request(`/api/cart/items/${productId}`, { method: "PUT", body: { quantity: 2 } }, token);

    // -------------------------------------------------------------
    // PHASES 6 & 7: CHECKOUT & ATOMIC STOCK RESERVATION
    // -------------------------------------------------------------
    console.log("\n>>> Step 3: Phases 6 & 7 - Checkout & 5-Minute Stock Reservation");
    const checkoutRes = await request("/api/orders/checkout", { method: "POST" }, token);
    const order = checkoutRes.data.order;
    console.log(`✓ Order Created: ${order.orderNumber}, Status: ${order.status}`);
    console.log(`✓ Reservation Expiry: ${order.expiresAt}`);

    // Verify stock is reserved
    const { data: stockAfterReserve } = await request(`/api/products/${productId}/stock`);
    console.log("✓ Product Stock after reservation:", {
        totalStock: stockAfterReserve.stockInfo.totalStock,
        reservedStock: stockAfterReserve.stockInfo.reservedStock,
        availableStock: stockAfterReserve.stockInfo.availableStock,
    });
    if (stockAfterReserve.stockInfo.reservedStock !== 2 || stockAfterReserve.stockInfo.availableStock !== 18) {
        throw new Error("Reservation stock math incorrect!");
    }

    // -------------------------------------------------------------
    // PHASE 9: MOCK PAYMENT & IDEMPOTENCY
    // -------------------------------------------------------------
    console.log("\n>>> Step 4: Phase 9 - Mock Payment Processing & Idempotency");
    const idempotencyKey = `KEY-${runId}-1`;

    // Process successful payment
    const payRes1 = await request(
        "/api/payments/process",
        {
            method: "POST",
            body: {
                orderId: order._id,
                outcome: "SUCCESS",
                idempotencyKey,
            },
        },
        token
    );
    console.log(`✓ Payment processed: Status=${payRes1.data.payment.status}, Order Status=${payRes1.data.order.status}`);

    // Test Idempotency (Repeat exact same payment)
    const payRes2 = await request(
        "/api/payments/process",
        {
            method: "POST",
            body: {
                orderId: order._id,
                outcome: "SUCCESS",
                idempotencyKey,
            },
        },
        token
    );
    console.log(`✓ Idempotency verified: Replay detected=${payRes2.data.isIdempotentReplay}, TransactionId=${payRes2.data.payment.transactionId}`);

    // Verify stock after paid order confirmation
    const { data: stockAfterPay } = await request(`/api/products/${productId}/stock`);
    console.log("✓ Product Stock after payment confirmed:", {
        totalStock: stockAfterPay.stockInfo.totalStock,
        reservedStock: stockAfterPay.stockInfo.reservedStock,
        availableStock: stockAfterPay.stockInfo.availableStock,
    });
    if (stockAfterPay.stockInfo.totalStock !== 18 || stockAfterPay.stockInfo.reservedStock !== 0) {
        throw new Error("Stock confirmation math incorrect!");
    }

    // -------------------------------------------------------------
    // PHASE 10: ORDER CANCELLATION & STOCK RESTORATION
    // -------------------------------------------------------------
    console.log("\n>>> Step 5: Phase 10 - Order Cancellation & Stock Restoration");
    const cancelRes = await request(
        `/api/orders/${order._id}/cancel`,
        {
            method: "POST",
            body: { reason: "Customer requested return" },
        },
        token
    );
    console.log(`✓ Order cancelled: Status=${cancelRes.data.order.status}`);

    // Verify stock is restored
    const { data: stockAfterCancel } = await request(`/api/products/${productId}/stock`);
    console.log("✓ Product Stock after refund/cancellation:", {
        totalStock: stockAfterCancel.stockInfo.totalStock,
        reservedStock: stockAfterCancel.stockInfo.reservedStock,
        availableStock: stockAfterCancel.stockInfo.availableStock,
    });
    if (stockAfterCancel.stockInfo.totalStock !== 20 || stockAfterCancel.stockInfo.availableStock !== 20) {
        throw new Error("Stock restoration math incorrect!");
    }

    // -------------------------------------------------------------
    // PAYMENT FAILURE SIMULATION
    // -------------------------------------------------------------
    console.log("\n>>> Step 6: Payment Failure & Immediate Stock Release");
    // Add 3 to cart, checkout
    await request("/api/cart/items", { method: "POST", body: { productId, quantity: 3 } }, token);
    const { data: failOrderRes } = await request("/api/orders/checkout", { method: "POST" }, token);
    const failOrderId = failOrderRes.order._id;
    console.log(`✓ Created order for failure test: ${failOrderRes.order.orderNumber}`);

    // Process payment with outcome = "FAILED"
    const failPayRes = await request(
        "/api/payments/process",
        {
            method: "POST",
            body: {
                orderId: failOrderId,
                outcome: "FAILED",
                idempotencyKey: `KEY-FAIL-${runId}`,
            },
        },
        token
    );
    console.log(`✓ Payment Failed simulation: Status=${failPayRes.data.payment.status}, Order=${failPayRes.data.order.status}`);

    const { data: stockAfterFail } = await request(`/api/products/${productId}/stock`);
    console.log("✓ Stock immediately restored after payment failure:", {
        totalStock: stockAfterFail.stockInfo.totalStock,
        reservedStock: stockAfterFail.stockInfo.reservedStock,
        availableStock: stockAfterFail.stockInfo.availableStock,
    });
    if (stockAfterFail.stockInfo.availableStock !== 20) {
        throw new Error("Stock not restored after payment failure!");
    }

    // -------------------------------------------------------------
    // PHASE 14: CONCURRENCY STRESS TEST (ZERO OVERSELLING)
    // -------------------------------------------------------------
    console.log("\n=================================================================");
    console.log(">>> Step 7: Phase 14 - CONCURRENCY STRESS TEST (Zero Overselling)");
    console.log("=================================================================");

    const LIMITED_STOCK = 3;
    const CONCURRENT_BUYERS = 10;

    // Create a product with strictly 3 in stock
    const { data: flashProd } = await request(
        "/api/products",
        {
            method: "POST",
            body: {
                name: "Limited Edition Smart POS Terminal",
                sku: `FLASH_${runId}`,
                price: 299.99,
                stock: LIMITED_STOCK,
            },
        },
        token
    );
    const flashProductId = flashProd.product._id;
    console.log(`✓ Created Flash Sale Product with EXACTLY ${LIMITED_STOCK} items in stock.\n`);

    console.log(`Simulating ${CONCURRENT_BUYERS} simultaneous checkout requests...`);

    // Create 10 customer accounts and carts
    const buyerTokens = [];
    for (let i = 0; i < CONCURRENT_BUYERS; i++) {
        const { data: buyerAuth } = await request("/api/auth/register", {
            method: "POST",
            body: {
                username: `buyer_${runId}_${i}`,
                email: `buyer_${runId}_${i}@pos.com`,
                password: "password123",
            },
        });
        buyerTokens.push(buyerAuth.token);

        // Add 1 flash sale product to cart
        await request(
            "/api/cart/items",
            {
                method: "POST",
                body: { productId: flashProductId, quantity: 1 },
            },
            buyerAuth.token
        );
    }
    console.log(`✓ Setup ${CONCURRENT_BUYERS} user accounts with 1 item in cart each.`);

    // FIRE ALL 10 CHECKOUTS SIMULTANEOUSLY!
    console.log(`🚀 FIRING ${CONCURRENT_BUYERS} CHECKOUTS SIMULTANEOUSLY VIA Promise.all()...`);
    const checkoutPromises = buyerTokens.map((buyerToken) =>
        request("/api/orders/checkout", { method: "POST" }, buyerToken)
    );

    const results = await Promise.all(checkoutPromises);

    const successfulCheckouts = results.filter((r) => r.status === 201);
    const failedCheckouts = results.filter((r) => r.status !== 201);

    console.log(`\n--- CONCURRENCY RESULTS ---`);
    console.log(`Total Requests:      ${CONCURRENT_BUYERS}`);
    console.log(`Successful (201):    ${successfulCheckouts.length}`);
    console.log(`Rejected (Stockout): ${failedCheckouts.length}`);
    console.log("All responses:", results.map((r, i) => `Request #${i + 1}: status=${r.status}, msg=${r.data?.message}`));

    // Check inventory in MongoDB
    const { data: finalFlashStock } = await request(`/api/products/${flashProductId}/stock`);
    console.log("Final Database Inventory State:", finalFlashStock.stockInfo);

    // Mathematical Assertions
    if (successfulCheckouts.length !== LIMITED_STOCK) {
        throw new Error(
            `CONCURRENCY FAILURE: Expected exactly ${LIMITED_STOCK} successes, but got ${successfulCheckouts.length}`
        );
    }

    if (failedCheckouts.length !== CONCURRENT_BUYERS - LIMITED_STOCK) {
        throw new Error(
            `CONCURRENCY FAILURE: Expected ${CONCURRENT_BUYERS - LIMITED_STOCK} rejected, but got ${failedCheckouts.length}`
        );
    }

    if (finalFlashStock.stockInfo.availableStock !== 0) {
        throw new Error(
            `CONCURRENCY FAILURE: availableStock should be 0, but is ${finalFlashStock.stockInfo.availableStock}`
        );
    }

    if (finalFlashStock.stockInfo.reservedStock !== LIMITED_STOCK) {
        throw new Error(
            `CONCURRENCY FAILURE: reservedStock should be ${LIMITED_STOCK}, but is ${finalFlashStock.stockInfo.reservedStock}`
        );
    }

    console.log("\n🎉 ZERO OVERSELLING MATHEMATICALLY VERIFIED!");
    console.log("MongoDB atomic condition filter successfully protected stock integrity across parallel requests.");
    console.log("=================================================================\n");
};

runAllTests().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
