import { CategoryModel } from "../models/categoryModel.js";

export const CategoryController = {
    getAll: async (req, res) => {
        try {
            const categorias = await CategoryModel.getAll();
            res.json(categorias);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener categorías" });
        }
    },

    create: async (req, res) => {
        try {
            const id = await CategoryModel.create(req.body);
            res.json({ message: "Categoría creada", id });
        } catch (error) {
            res.status(500).json({ error: "Error al crear categoría" });
        }
    }
};
