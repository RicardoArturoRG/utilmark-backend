import db from "../config/db.js";

export const CategoryModel = {
  getAll: async () => {
    try {
      console.log("📂 Consultando categorías");

      const [rows] = await db.query(
        "SELECT id, nombre FROM categorias ORDER BY nombre ASC"
      );

      return rows;

    } catch (error) {
      console.error("❌ ERROR REAL en CategoryModel.getAll:", error);
      throw error;
    }
  },

  create: async ({ nombre }) => {
    try {
      const [result] = await db.query(
        "INSERT INTO categorias (nombre) VALUES (?)",
        [nombre]
      );

      return result.insertId;

    } catch (error) {
      console.error("❌ Error creando categoría:", error);
      throw error;
    }
  }
};
