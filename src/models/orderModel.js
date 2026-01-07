// src/models/orderModel.js
import db from "../config/db.js";

export const OrderModel = {
    // Crear nuevo pedido
    create: async (data) => {
        const { user_id, total_pagar, metodo_pago, direccion_envio, telefono_contacto, metodo_entrega } = data;

        const [result] = await db.query(
            `INSERT INTO pedidos (user_id, total_pagar, metodo_pago, direccion_envio, telefono_contacto, metodo_entrega, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
            [user_id, total_pagar, metodo_pago, direccion_envio, telefono_contacto, metodo_entrega]
        );

        return result.insertId;
    },

    // Obtener todos los pedidos
    findAll: async () => {
        const [rows] = await db.query(`
            SELECT 
                p.*, 
                CONCAT(u.nombres, ' ', u.apellidos) as cliente_nombre,
                u.email as cliente_email,
                u.telefono
            FROM pedidos p
            INNER JOIN usuario u ON p.user_id = u.id
            ORDER BY p.fecha_creacion DESC
        `);
        return rows;
    },

    // Obtener pedido por ID
    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT 
                p.*, 
                CONCAT(u.nombres, ' ', u.apellidos) as cliente_nombre,
                u.email as cliente_email,
                u.telefono
            FROM pedidos p
            INNER JOIN usuario u ON p.user_id = u.id
            WHERE p.id = ?
        `, [id]);
        return rows[0];
    },

    // Obtener productos de un pedido
    getOrderProducts: async (pedidoId) => {
        const [rows] = await db.query(`
            SELECT 
                dp.*,
                p.nombre,
                p.imagen_url,
                p.codigo
            FROM detalle_pedido dp
            INNER JOIN productos p ON dp.productos_id = p.id
            WHERE dp.pedidos_id = ?
        `, [pedidoId]);
        return rows;
    },

    // Actualizar estado del pedido
    updateStatus: async (id, estado) => {
        const [result] = await db.query(
            `UPDATE pedidos SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?`,
            [estado, id]
        );
        return result.affectedRows > 0;
    },

    // Eliminar pedido
    delete: async (id) => {
        // Primero eliminar detalles
        await db.query(`DELETE FROM detalle_pedido WHERE pedidos_id = ?`, [id]);
        
        // Luego eliminar pedido
        const [result] = await db.query(`DELETE FROM pedidos WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    // Obtener estadísticas
    getStats: async () => {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as total_pedidos,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'preparacion' THEN 1 ELSE 0 END) as en_preparacion,
                SUM(CASE WHEN estado = 'reparto' THEN 1 ELSE 0 END) as en_reparto,
                SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) as entregados,
                SUM(CASE WHEN estado = 'entregado' AND DATE(fecha_creacion) = CURDATE() THEN 1 ELSE 0 END) as entregados_hoy,
                SUM(total_pagar) as total_ventas
            FROM pedidos
        `);
        return rows[0];
    },

    // Obtener pedidos por usuario
    findByUserId: async (userId) => {
        const [rows] = await db.query(`
            SELECT 
                p.*, 
                CONCAT(u.nombres, ' ', u.apellidos) as cliente_nombre,
                u.email as cliente_email
            FROM pedidos p
            INNER JOIN usuario u ON p.user_id = u.id
            WHERE p.user_id = ?
            ORDER BY p.fecha_creacion DESC
        `, [userId]);
        return rows;
    }
};