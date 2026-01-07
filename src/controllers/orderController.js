// src/controllers/orderController.js - VERSIÓN CORREGIDA
import db from "../config/db.js";
// src/controllers/orderController.js - AGREGAR AL INICIO
import { 
    sendOrderConfirmation, 
    sendAdminNotification, 
    sendStatusUpdate 
} from "../services/emailService.js";
// =========================
// 📌 FUNCIONES DE MAPEO DE ESTADOS
// =========================
function mapearEstadoBDaFrontend(estadoBD) {
    if (!estadoBD) return 'pendiente';
    
    const mapeo = {
        'pendiente_pago': 'pendiente',
        'pagado': 'preparacion',
        'en_preparacion': 'preparacion',
        'enviado': 'reparto',
        'entregado': 'entregado',
        'cancelado': 'cancelado'
    };
    
    return mapeo[estadoBD] || estadoBD;
}

function mapearEstadoFrontendaBD(estadoFrontend) {
    if (!estadoFrontend) return 'pendiente_pago';
    
    const mapeo = {
        'pendiente': 'pendiente_pago',
        'preparacion': 'en_preparacion',
        'reparto': 'enviado',
        'entregado': 'entregado',
        'cancelado': 'cancelado'
    };
    
    return mapeo[estadoFrontend] || estadoFrontend;
}

// =========================
// 📌 OBTENER TODOS LOS PEDIDOS (ADMIN)
// =========================
export const getAllOrders = async (req, res) => {
    try {
        console.log('📋 Obteniendo todos los pedidos...');
        
        const [orders] = await db.query(`
            SELECT 
                p.*, 
                CONCAT(u.nombres, ' ', u.apellidos) as cliente_nombre,
                u.email as cliente_email,
                u.telefono
            FROM pedidos p
            INNER JOIN usuario u ON p.user_id = u.id
            ORDER BY p.fecha_creacion DESC
        `);

        console.log(`✅ ${orders.length} pedidos encontrados en BD`);

        // Formatear para frontend
        const ordersFormatted = orders.map(order => ({
            id: order.id,
            cliente_nombre: order.cliente_nombre || 'Cliente',
            cliente_email: order.cliente_email || '',
            direccion: order.direccion_envio || 'No especificada',
            tipo_entrega: order.metodo_entrega || 'tienda',
            estado: mapearEstadoBDaFrontend(order.estado),
            estado_original: order.estado,
            total: parseFloat(order.total_pagar) || 0,
            total_pagar: parseFloat(order.total_pagar) || 0,
            fecha_creacion: order.fecha_creacion,
            telefono: order.telefono_contacto || order.telefono || '',
            user_id: order.user_id,
            metodo_pago: order.metodo_pago || 'No especificado',
            comentarios: order.comentarios || ''
        }));

        return res.json({
            success: true,
            count: ordersFormatted.length,
            data: ordersFormatted
        });

    } catch (error) {
        console.error('❌ Error en getAllOrders:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error al obtener todos los pedidos" 
        });
    }
};

// =========================
// 📌 OBTENER DETALLE DE UN PEDIDO
// =========================
export const getOrderDetail = async (req, res) => {
    const { orderId } = req.params;

    try {
        console.log(`📦 Obteniendo detalle del pedido ${orderId}...`);

        // Obtener información del pedido
        const [orderResult] = await db.query(`
            SELECT 
                p.*, 
                CONCAT(u.nombres, ' ', u.apellidos) as cliente_nombre,
                u.email as cliente_email,
                u.telefono
            FROM pedidos p
            INNER JOIN usuario u ON p.user_id = u.id
            WHERE p.id = ?
        `, [orderId]);

        if (orderResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado"
            });
        }

        const order = orderResult[0];

        // Obtener productos del pedido
        const [productsResult] = await db.query(`
            SELECT 
                dp.*,
                p.nombre,
                p.imagen_url,
                p.sku,
                p.descripcion
            FROM detalle_pedido dp
            INNER JOIN productos p ON dp.productos_id = p.id
            WHERE dp.pedidos_id = ?
            ORDER BY dp.id
        `, [orderId]);

        const productos = productsResult.map(prod => ({
            id: prod.productos_id,
            nombre: prod.nombre || 'Producto',
            descripcion: prod.descripcion || '',
            cantidad: parseInt(prod.cantidad) || 1,
            precio: parseFloat(prod.precio_unitario) || 0,
            subtotal: parseFloat(prod.subtotal) || 0,
            imagen_url: prod.imagen_url || '',
            codigo: prod.codigo || ''
        }));

        // Calcular total
        const totalCalculado = productos.reduce((sum, prod) => sum + prod.subtotal, 0);
        const total = parseFloat(order.total_pagar) || totalCalculado;

        // Formatear respuesta
        const orderFormatted = {
            id: order.id,
            cliente_nombre: order.cliente_nombre,
            cliente_email: order.cliente_email,
            direccion_envio: order.direccion_envio,
            telefono_contacto: order.telefono_contacto || order.telefono,
            tipo_entrega: order.metodo_entrega || 'tienda',
            estado: mapearEstadoBDaFrontend(order.estado),
            estado_original: order.estado,
            metodo_pago: order.metodo_pago,
            total_pagar: total,
            total: total,
            fecha_creacion: order.fecha_creacion,
            productos: productos,
            comentarios: order.comentarios || 'No hay comentarios',
            subtotal_productos: totalCalculado
        };

        console.log(`✅ Detalle del pedido ${orderId} cargado con ${productos.length} productos`);

        return res.json({
            success: true,
            data: orderFormatted
        });

    } catch (error) {
        console.error('❌ Error en getOrderDetail:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error al obtener detalle del pedido" 
        });
    }
};

// =========================
// 📌 ACTUALIZAR ESTADO DEL PEDIDO
// =========================
export const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { estado } = req.body;

    console.log(`🔄 Actualizando estado del pedido ${orderId} a: ${estado}`);

    try {
        // Mapear estado de frontend a BD
        const estadoBD = mapearEstadoFrontendaBD(estado);
        console.log(`📊 Estado mapeado: ${estado} → ${estadoBD}`);

        // Verificar si el pedido existe
        const [orderCheck] = await db.query(
            `SELECT id, estado FROM pedidos WHERE id = ?`,
            [orderId]
        );

        if (orderCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado"
            });
        }

        console.log(`📝 Estado anterior: ${orderCheck[0].estado}`);

        // Actualizar estado en BD
        await db.query(
            `UPDATE pedidos SET estado = ? WHERE id = ?`,
            [estadoBD, orderId]
        );

        console.log(`✅ Estado del pedido ${orderId} actualizado a: ${estadoBD}`);

        return res.json({ 
            success: true,
            message: "Estado actualizado correctamente",
            data: {
                id: orderId,
                estado: estado,
                estado_bd: estadoBD
            }
        });

    } catch (error) {
        console.error('❌ Error en updateOrderStatus:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error al actualizar estado" 
        });
    }
};

// =========================
// 📌 ELIMINAR PEDIDO
// =========================
export const deleteOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        console.log(`🗑️ Eliminando pedido ${orderId}...`);

        // Verificar si el pedido existe
        const [orderCheck] = await db.query(
            `SELECT id FROM pedidos WHERE id = ?`,
            [orderId]
        );

        if (orderCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado"
            });
        }

        // Eliminar detalles del pedido
        await db.query(
            `DELETE FROM detalle_pedido WHERE pedidos_id = ?`,
            [orderId]
        );

        // Eliminar el pedido
        await db.query(
            `DELETE FROM pedidos WHERE id = ?`,
            [orderId]
        );

        console.log(`✅ Pedido ${orderId} eliminado correctamente`);

        return res.json({
            success: true,
            message: "Pedido eliminado correctamente"
        });

    } catch (error) {
        console.error('❌ Error en deleteOrder:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error al eliminar pedido" 
        });
    }
};

// =========================
// 📌 OBTENER ESTADÍSTICAS DE PEDIDOS
// =========================
export const getOrderStats = async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas de pedidos...');

        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_pedidos,
                SUM(CASE WHEN estado = 'pendiente_pago' THEN 1 ELSE 0 END) as pendientes_pago,
                SUM(CASE WHEN estado = 'en_preparacion' THEN 1 ELSE 0 END) as en_preparacion,
                SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) as enviados,
                SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) as entregados,
                SUM(CASE WHEN estado = 'entregado' AND DATE(fecha_creacion) = CURDATE() THEN 1 ELSE 0 END) as entregados_hoy,
                SUM(total_pagar) as total_ventas
            FROM pedidos
        `);

        // Mapear estadísticas para frontend
        const estadisticas = {
            total_pedidos: parseInt(stats[0].total_pedidos) || 0,
            pendientes: parseInt(stats[0].pendientes_pago) || 0, // pendiente_pago → pendientes
            en_preparacion: parseInt(stats[0].en_preparacion) || 0,
            enviados: parseInt(stats[0].enviados) || 0, // enviados → reparto
            entregados: parseInt(stats[0].entregados) || 0,
            entregados_hoy: parseInt(stats[0].entregados_hoy) || 0,
            total_ventas: parseFloat(stats[0].total_ventas) || 0
        };

        console.log('✅ Estadísticas obtenidas:', estadisticas);

        return res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('❌ Error en getOrderStats:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error al obtener estadísticas"
        });
    }
};

// =========================
// 📌 EXPORTAR PEDIDOS A CSV
// =========================
export const exportOrders = async (req, res) => {
    try {
        console.log('📤 Exportando pedidos a CSV...');
        
        const { estado, fecha_inicio, fecha_fin } = req.query;
        
        let query = `
            SELECT 
                p.id,
                CONCAT(u.nombres, ' ', u.apellidos) as cliente,
                u.email,
                u.telefono,
                p.total_pagar,
                p.estado,
                p.metodo_pago,
                p.metodo_entrega,
                p.direccion_envio,
                p.telefono_contacto,
                p.fecha_creacion,
                p.comentarios
            FROM pedidos p
            INNER JOIN usuario u ON p.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (estado && estado !== 'todos') {
            const estadoBD = mapearEstadoFrontendaBD(estado);
            query += ` AND p.estado = ?`;
            params.push(estadoBD);
        }

        if (fecha_inicio && fecha_fin) {
            query += ` AND DATE(p.fecha_creacion) BETWEEN ? AND ?`;
            params.push(fecha_inicio, fecha_fin);
        }

        query += ` ORDER BY p.fecha_creacion DESC`;

        const [orders] = await db.query(query, params);

        // Mapear estados para exportación
        const ordersFormatted = orders.map(order => ({
            ID: order.id,
            Cliente: order.cliente,
            Email: order.email,
            Telefono: order.telefono_contacto || order.telefono,
            Total: parseFloat(order.total_pagar).toFixed(2),
            Estado: mapearEstadoBDaFrontend(order.estado),
            'Estado BD': order.estado,
            'Método Pago': order.metodo_pago,
            'Tipo Entrega': order.metodo_entrega,
            Dirección: order.direccion_envio,
            'Fecha Creación': new Date(order.fecha_creacion).toLocaleString('es-ES'),
            Comentarios: order.comentarios || ''
        }));

        console.log(`✅ ${ordersFormatted.length} pedidos listos para exportar`);

        return res.json({
            success: true,
            data: ordersFormatted,
            count: ordersFormatted.length
        });

    } catch (error) {
        console.error('❌ Error en exportOrders:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error al exportar pedidos"
        });
    }
};

// =========================
// 📌 CREAR NUEVO PEDIDO (SIMPLIFICADA)
// =========================
export const createOrder = async (req, res) => {
    try {
        const { user_id, productos, total_pagar, metodo_pago, direccion_envio, telefono_contacto, metodo_entrega, comentarios } = req.body;

        console.log(`🛒 Creando nuevo pedido para usuario ${user_id}...`);

        // Insertar pedido
        const [result] = await db.query(
            `INSERT INTO pedidos (user_id, total_pagar, metodo_pago, direccion_envio, telefono_contacto, metodo_entrega, estado, comentarios)
             VALUES (?, ?, ?, ?, ?, ?, 'pendiente_pago', ?)`,
            [user_id, total_pagar, metodo_pago, direccion_envio, telefono_contacto, metodo_entrega, comentarios || '']
        );

        const pedidoId = result.insertId;
        console.log(`✅ Pedido creado con ID: ${pedidoId}`);

        // Insertar productos en detalle_pedido
        if (productos && Array.isArray(productos) && productos.length > 0) {
            console.log(`📦 Insertando ${productos.length} productos en detalle_pedido...`);
            
            for (const producto of productos) {
                const subtotal = (parseFloat(producto.precio) || 0) * (parseInt(producto.cantidad) || 1);
                
                await db.query(
                    `INSERT INTO detalle_pedido (pedidos_id, productos_id, cantidad, precio_unitario, subtotal)
                     VALUES (?, ?, ?, ?, ?)`,
                    [pedidoId, producto.id, producto.cantidad, producto.precio, subtotal]
                );
            }
        }

        return res.json({
            success: true,
            message: "Pedido creado correctamente",
            data: { 
                id: pedidoId,
                total_productos: productos ? productos.length : 0
            }
        });

    } catch (error) {
        console.error('❌ Error en createOrder:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error al crear pedido" 
        });
    }
};

// =========================
// 📌 OBTENER PEDIDOS POR USUARIO
// =========================
export const getOrdersByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        console.log(`👤 Obteniendo pedidos del usuario ${userId}...`);

        const [orders] = await db.query(`
            SELECT 
                p.*, 
                CONCAT(u.nombres, ' ', u.apellidos) as cliente_nombre,
                u.email as cliente_email
            FROM pedidos p
            INNER JOIN usuario u ON p.user_id = u.id
            WHERE p.user_id = ?
            ORDER BY p.fecha_creacion DESC
        `, [userId]);

        const ordersFormatted = orders.map(order => ({
            id: order.id,
            cliente_nombre: order.cliente_nombre,
            cliente_email: order.cliente_email,
            direccion: order.direccion_envio,
            tipo_entrega: order.metodo_entrega || 'tienda',
            estado: mapearEstadoBDaFrontend(order.estado),
            estado_original: order.estado,
            total: parseFloat(order.total_pagar) || 0,
            fecha_creacion: order.fecha_creacion,
            metodo_pago: order.metodo_pago,
            comentarios: order.comentarios || ''
        }));

        console.log(`✅ ${ordersFormatted.length} pedidos encontrados para usuario ${userId}`);

        return res.json({
            success: true,
            data: ordersFormatted
        });

    } catch (error) {
        console.error('❌ Error en getOrdersByUser:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error al obtener pedidos del usuario" 
        });
    }
};

// =========================
// 📌 ACTUALIZAR PEDIDO COMPLETO (OPCIONAL)
// =========================
export const updateOrder = async (req, res) => {
    const { orderId } = req.params;
    const { direccion_envio, telefono_contacto, comentarios } = req.body;

    try {
        console.log(`✏️ Actualizando información del pedido ${orderId}...`);

        const [orderCheck] = await db.query(
            `SELECT id FROM pedidos WHERE id = ?`,
            [orderId]
        );

        if (orderCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado"
            });
        }

        await db.query(
            `UPDATE pedidos SET direccion_envio = ?, telefono_contacto = ?, comentarios = ? WHERE id = ?`,
            [direccion_envio, telefono_contacto, comentarios, orderId]
        );

        console.log(`✅ Información del pedido ${orderId} actualizada`);

        return res.json({ 
            success: true,
            message: "Información del pedido actualizada correctamente"
        });

    } catch (error) {
        console.error('❌ Error en updateOrder:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error al actualizar información del pedido" 
        });
    }
};