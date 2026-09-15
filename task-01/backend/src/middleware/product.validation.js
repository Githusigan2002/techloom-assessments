// Validating product creation and update inputs
export const validateProduct = (req, res, next) => {
    const { name, sku, price, stock } = req.body;

    // Check required fields for product creation
    if (req.method === "POST") {
        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Product name is required",
            });
        }

        if (!sku || typeof sku !== "string" || sku.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Product SKU is required",
            });
        }

        if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "Price is required and must be a non-negative number",
            });
        }

        if (stock !== undefined && (isNaN(stock) || Number(stock) < 0)) {
            return res.status(400).json({
                success: false,
                message: "Stock must be a non-negative number",
            });
        }
    }

    // For update (PUT), validate fields if they are sent in the body
    if (req.method === "PUT") {
        if (price !== undefined && (isNaN(price) || Number(price) < 0)) {
            return res.status(400).json({
                success: false,
                message: "Price must be a non-negative number",
            });
        }

        if (stock !== undefined && (isNaN(stock) || Number(stock) < 0)) {
            return res.status(400).json({
                success: false,
                message: "Stock must be a non-negative number",
            });
        }
    }

    // Validation passed, continue to controller
    next();
};

// Middleware for validating stock updates and adjustments
export const validateInventory = (req, res, next) => {
    const { stock, quantity, action } = req.body;

    // Case 1: Setting stock directly
    if (stock !== undefined) {
        if (isNaN(stock) || Number(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock quantity must be a non-negative number",
            });
        }
    }

    // Case 2: Adjusting stock by an amount (e.g., action: 'add' or 'reduce')
    if (quantity !== undefined) {
        if (isNaN(quantity) || Number(quantity) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Adjustment quantity must be greater than 0",
            });
        }

        if (action && !["add", "reduce", "set"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Action must be 'add', 'reduce', or 'set'",
            });
        }
    }

    // Ensure at least one stock field is provided
    if (stock === undefined && quantity === undefined) {
        return res.status(400).json({
            success: false,
            message: "Please provide 'stock' or 'quantity' to update inventory",
        });
    }

    next();
};
