import express from "express";
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getCurrentStock,
    updateStock,
} from "../controllers/product.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
    validateProduct,
    validateInventory,
} from "../middleware/product.validation.js";

const router = express.Router();

// Get all products & Create new product
router
    .route("/")
    .get(getAllProducts)
    .post(protect, validateProduct, createProduct);

// Get current stock for a product
router.route("/:id/stock")
    .get(getCurrentStock)
    .patch(protect, validateInventory, updateStock);

// Get single product, Update product, Delete product
router
    .route("/:id")
    .get(getProductById)
    .put(protect, validateProduct, updateProduct)
    .delete(protect, deleteProduct);

export default router;
