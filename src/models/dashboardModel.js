// models/dashboardModel.js
import db from "../config/db.js";

export const DashboardModel = {
  // Contar todos los productos
  async totalProductos() {
    const [rows] = await db.query("SELECT COUNT(*) AS total FROM productos");
    return rows[0].total;
  },

  // Contar productos con stock <= 5
  async stockBajo() {
    const [rows] = await db.query("SELECT COUNT(*) AS total FROM productos WHERE stock <= 5");
    return rows[0].total;
  },

  // Sumar ventas del mes (estado 'entregado' en tu caso)
  async ventasMes() {
    const fechaInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [rows] = await db.query(
      "SELECT SUM(total_pagar) AS total FROM pedidos WHERE estado = 'entregado' AND fecha_creacion >= ?",
      [fechaInicio]
    );
    return rows[0].total || 0;
  },

  // Contar pedidos pendientes
  async pedidosPendientes() {
    const [rows] = await db.query("SELECT COUNT(*) AS total FROM pedidos WHERE estado = 'pendiente_pago'");
    return rows[0].total;
  },

  // Últimos 5 productos
  async ultimosProductos() {
    const [rows] = await db.query(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id 
      ORDER BY p.fecha_creacion DESC 
      LIMIT 5
    `);
    return rows;
  },

  // Últimos 5 pedidos
  async ultimosPedidos() {
    const [rows] = await db.query(`
      SELECT p.*, u.nombres, u.apellidos 
      FROM pedidos p 
      LEFT JOIN usuario u ON p.user_id = u.id 
      ORDER BY p.fecha_creacion DESC 
      LIMIT 5
    `);
    return rows;
  }
};