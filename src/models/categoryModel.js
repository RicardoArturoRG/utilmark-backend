import db from "../config/db.js";

export const CategoryModel = {
    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM categorias ORDER BY id ASC");
        return rows;
    },

    create: async ({ nombre, descripcion }) => {
        const [result] = await db.query(
            "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)",
            [nombre, descripcion]
        );
        return result.insertId;
    }
};
