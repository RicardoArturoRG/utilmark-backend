import express from "express";
import { CategoryController } from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", CategoryController.getAll);
router.post("/", CategoryController.create);

// En tu backend (routes/categoryRoutes.js)
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().select('id nombre description');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

export default router;
