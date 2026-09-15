import Product from "../models/product.model.js";

// Create a new product

export const createProduct = async (req, res) => {
    try {
        const { name, sku, description, category, price, stock } = req.body;

        // Check if product with the same SKU already exists
        const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: `Product with SKU '${sku.toUpperCase()}' already exists`,
            });
        }

        // Create new product in database
        const product = await Product.create({
            name,
            sku: sku.toUpperCase(),
            description: description || "",
            category: category || "General",
            price: Number(price),
            stock: stock !== undefined ? Number(stock) : 0,
            reservedStock: 0,
        });

        // Return the created product
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({
            success: false,
            message: "Server error creating product",
            error: error.message,
        });
    }
};

// Get all products

export const getAllProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, inStock } = req.query;
        let filter = {};

        // Optional filter by category
        if (category) {
            filter.category = category;
        }

        // Optional search by product name or SKU
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { sku: { $regex: search, $options: "i" } },
            ];
        }

        // Optional filter by price range
        if (minPrice !== undefined && minPrice !== "" || maxPrice !== undefined && maxPrice !== "") {
            filter.price = {};
            if (minPrice !== undefined && minPrice !== "") {
                filter.price.$gte = Number(minPrice);
            }
            if (maxPrice !== undefined && maxPrice !== "") {
                filter.price.$lte = Number(maxPrice);
            }
        }

        // Optional filter by availability (inStock = true)
        if (inStock === "true") {
            filter.availableStock = { $gt: 0 };
        }

        // Fetch products sorted by newest first
        const products = await Product.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching products",
            error: error.message,
        });
    }
};

// Get single product by ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching product",
            error: error.message,
        });
    }
};

// Update an existing product

export const updateProduct = async (req, res) => {
    try {
        const { name, sku, description, category, price, stock } = req.body;

        // Find existing product by ID
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // If SKU is being updated, check that it doesn't conflict with another product
        if (sku && sku.toUpperCase() !== product.sku) {
            const skuExists = await Product.findOne({
                sku: sku.toUpperCase(),
                _id: { $ne: product._id },
            });
            if (skuExists) {
                return res.status(400).json({
                    success: false,
                    message: `Product with SKU '${sku.toUpperCase()}' already exists`,
                });
            }
            product.sku = sku.toUpperCase();
        }

        // Update fields if provided
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (category !== undefined) product.category = category;
        if (price !== undefined) product.price = Number(price);
        if (stock !== undefined) {
            if (Number(stock) < product.reservedStock) {
                return res.status(400).json({
                    success: false,
                    message: `Stock cannot be set lower than currently reserved stock (${product.reservedStock})`,
                });
            }
            product.stock = Number(stock);
        }

        // Save updated product
        const updatedProduct = await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            success: false,
            message: "Server error updating product",
            error: error.message,
        });
    }
};

// Delete a product
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Check if product has active reservations before deleting
        if (product.reservedStock > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete product with active stock reservations",
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            success: false,
            message: "Server error deleting product",
            error: error.message,
        });
    }
};

// Get current stock status for a product

export const getCurrentStock = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Send stock overview
        res.status(200).json({
            success: true,
            stockInfo: {
                productId: product._id,
                name: product.name,
                sku: product.sku,
                totalStock: product.stock,
                reservedStock: product.reservedStock,
                availableStock: product.availableStock,
                isInStock: product.availableStock > 0,
            },
        });
    } catch (error) {
        console.error("Error getting stock status:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching stock status",
            error: error.message,
        });
    }
};

// Update or adjust product inventory

export const updateStock = async (req, res) => {
    try {
        const { stock, quantity, action } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        let newStock = product.stock;

        // Handle direct stock set
        if (stock !== undefined) {
            newStock = Number(stock);
        }
        // Handle adjustment actions: 'add', 'reduce', or 'set'
        else if (quantity !== undefined) {
            const qty = Number(quantity);
            if (action === "add") {
                newStock += qty;
            } else if (action === "reduce") {
                newStock -= qty;
            } else if (action === "set") {
                newStock = qty;
            }
        }

        // Inventory validation: stock cannot be negative
        if (newStock < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock cannot be negative",
            });
        }

        // Inventory validation: stock cannot drop below current active reservations
        if (newStock < product.reservedStock) {
            return res.status(400).json({
                success: false,
                message: `Cannot reduce stock below active reservations (${product.reservedStock})`,
            });
        }

        product.stock = newStock;
        await product.save();

        res.status(200).json({
            success: true,
            message: "Inventory updated successfully",
            stockInfo: {
                productId: product._id,
                name: product.name,
                sku: product.sku,
                totalStock: product.stock,
                reservedStock: product.reservedStock,
                availableStock: product.availableStock,
            },
        });
    } catch (error) {
        console.error("Error updating inventory:", error);
        res.status(500).json({
            success: false,
            message: "Server error updating inventory",
            error: error.message,
        });
    }
};
