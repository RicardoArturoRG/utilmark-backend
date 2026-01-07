import db from "../config/db.js";

export const ReportModel = {
  getKPIs: async () => {
    const [[ventas]] = await db.query(`
      SELECT IFNULL(SUM(total_pagar), 0) AS ventas_totales,
             COUNT(id) AS pedidos_realizados
      FROM pedidos
      WHERE estado IN ('pagado', 'enviado', 'entregado')
    `);

    const [[productos]] = await db.query(`
      SELECT IFNULL(SUM(cantidad), 0) AS productos_vendidos
      FROM detalle_pedido dp
      JOIN pedidos p ON dp.pedidos_id = p.id
      WHERE p.estado IN ('pagado', 'enviado', 'entregado')
    `);

    const [[clientes]] = await db.query(`
      SELECT COUNT(id) AS clientes_nuevos
      FROM usuario
      WHERE role = 'cliente'
    `);

    return {
      ventas_totales: ventas.ventas_totales,
      pedidos_realizados: ventas.pedidos_realizados,
      productos_vendidos: productos.productos_vendidos,
      clientes_nuevos: clientes.clientes_nuevos
    };
  },

  getVentasPorFecha: async (desde, hasta) => {
  const [rows] = await db.query(`
    SELECT 
      DATE(fecha_creacion) AS fecha,
      SUM(total_pagar) AS total
    FROM pedidos
    WHERE estado IN ('pagado', 'entregado')
      AND fecha_creacion BETWEEN ? AND ?
    GROUP BY DATE(fecha_creacion)
    ORDER BY fecha ASC
  `, [desde, hasta]);

  return rows;
},

getProductosMasVendidos: async (limite = 5) => {
  const [rows] = await db.query(`
    SELECT p.nombre, SUM(dp.cantidad) AS total_vendido
    FROM detalle_pedido dp
    JOIN productos p ON dp.productos_id = p.id
    JOIN pedidos ped ON dp.pedidos_id = ped.id
    WHERE ped.estado IN ('pagado','enviado','entregado')
    GROUP BY dp.productos_id
    ORDER BY total_vendido DESC
    LIMIT ?
  `, [limite]);

  return rows;
},

getClientesMasCompras: async (limite = 5) => {
  const [rows] = await db.query(`
    SELECT u.nombres, u.apellidos,
           COUNT(p.id) AS total_pedidos,
           IFNULL(SUM(p.total_pagar),0) AS total_gastado,
           MAX(p.fecha_creacion) AS ultima_compra
    FROM usuario u
    JOIN pedidos p ON u.id = p.user_id
    WHERE u.role = 'cliente' AND p.estado IN ('pagado','enviado','entregado')
    GROUP BY u.id
    ORDER BY total_gastado DESC
    LIMIT ?
  `, [limite]);

  return rows;
},


getVentasPorMetodoPago: async () => {
  // Total general para calcular porcentaje
  const [[totalGeneral]] = await db.query(`
    SELECT IFNULL(SUM(total_pagar),0) AS total
    FROM pedidos
    WHERE estado IN ('pagado','enviado','entregado')
  `);

  // Totales por método de pago
  const [rows] = await db.query(`
    SELECT metodo_pago,
           IFNULL(SUM(total_pagar),0) AS total_ventas,
           COUNT(id) AS transacciones
    FROM pedidos
    WHERE estado IN ('pagado','enviado','entregado')
    GROUP BY metodo_pago
    ORDER BY total_ventas DESC
  `);

  // Agregar porcentaje a cada método
  return rows.map(row => ({
    metodo_pago: row.metodo_pago,
    total_ventas: row.total_ventas,
    transacciones: row.transacciones,
    porcentaje: totalGeneral.total ? ((row.total_ventas / totalGeneral.total) * 100).toFixed(1) : 0
  }));
}

};

    