import db from "../config/db.js";

export const ProductModel = {
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT 
                p.*,
                c.nombre AS categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            ORDER BY p.id ASC
        `);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(
            "SELECT * FROM productos WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    create: async (data) => {
        const { nombre, descripcion, categoria_id, precio, stock, marca, sku, imagen_url } = data;

        const [result] = await db.query(
            `INSERT INTO productos 
            (nombre, descripcion, categoria_id, precio, stock, marca, sku, imagen_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion, categoria_id, precio, stock, marca, sku, imagen_url]
        );

        return result.insertId;
    },

    delete: async (id) => {
        await db.query("DELETE FROM productos WHERE id = ?", [id]);
    },
    update: async (id, data) => {
    // 🔥 SOLUCIÓN DEFINITIVA: Si data está vacío, no actualizar nada
    if (!data || Object.keys(data).length === 0) {
        console.log("⚠️  No hay cambios, omitiendo actualización");
        return { affectedRows: 0 };
    }

    const fields = [];
    const values = [];

    // 🔥 Aceptar cualquier valor (incluso string vacío) excepto undefined
    for (const key in data) {
        if (data[key] !== undefined) {
            fields.push(`${key} = ?`);
            
            // Si viene string vacío, mantenerlo como string vacío
            if (data[key] === "") {
                values.push("");
            } else {
                values.push(data[key]);
            }
        }
    }

    // Si después del filtro no hay campos, no actualizar
    if (fields.length === 0) {
        console.log("⚠️  No hay campos válidos para actualizar");
        return { affectedRows: 0 };
    }

    console.log("🔄 Actualizando producto ID:", id);
    console.log("📝 Campos:", fields);
    
    try {
        const [result] = await db.query(
            `UPDATE productos SET ${fields.join(", ")} WHERE id = ?`,
            [...values, id]
        );
        
        console.log("✅ Actualizado. Filas afectadas:", result.affectedRows);
        return result;
    } catch (error) {
        console.error("❌ Error SQL:", error);
        throw error;
    }
}


};