import express from "express";
import {
    getCart,
    addItemToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
} from "../controllers/cart.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protect all cart routes - cart belongs to logged in user
router.use(protect);

router.route("/")
    .get(getCart)
    .delete(clearCart);

router.route("/items")
    .post(addItemToCart);

router.route("/items/:productId")
    .put(updateCartItemQuantity)
    .delete(removeCartItem);

export default router;
