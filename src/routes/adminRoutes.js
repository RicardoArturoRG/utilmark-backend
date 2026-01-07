// src/routes/adminRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = express.Router();

// Middleware para verificar admin
const requireAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Token requerido' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Acceso denegado. Solo administradores' 
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error en middleware admin:', error);
        return res.status(401).json({ 
            success: false,
            message: 'Token inválido o expirado' 
        });
    }
};

// ==================================================
// RUTAS DE ADMINISTRADOR
// ==================================================

// 1. Estadísticas del dashboard
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        // Obtener estadísticas
        const [usersCount] = await db.query("SELECT COUNT(*) as total FROM usuario");
        const [productsCount] = await db.query("SELECT COUNT(*) as total FROM productos");
        const [ordersCount] = await db.query("SELECT COUNT(*) as total FROM pedidos WHERE DATE(fecha) = CURDATE()");
        const [salesToday] = await db.query("SELECT SUM(total) as total FROM pedidos WHERE DATE(fecha) = CURDATE()");
        
        res.json({
            success: true,
            stats: {
                totalUsers: usersCount[0]?.total || 0,
                totalProducts: productsCount[0]?.total || 0,
                todayOrders: ordersCount[0]?.total || 0,
                todaySales: salesToday[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Error obteniendo stats admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor' 
        });
    }
});

// 2. Verificar acceso admin (usado por el protector.js)
router.get('/check-access', requireAdmin, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Acceso de administrador confirmado',
            user: req.user
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor' 
        });
    }
});

// 3. Listar todos los usuarios
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, nombres, apellidos, email, telefono, role, estado, fecha_registro FROM usuario ORDER BY fecha_registro DESC"
        );
        
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor' 
        });
    }
});

// 4. Cambiar estado de usuario
router.put('/users/:id/status', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        await db.query(
            "UPDATE usuario SET estado = ? WHERE id = ?",
            [estado, id]
        );
        
        res.json({
            success: true,
            message: `Estado del usuario actualizado a: ${estado}`
        });
    } catch (error) {
        console.error('Error cambiando estado usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor' 
        });
    }
});

// 5. Obtener pedidos recientes
router.get('/orders/recent', requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT p.*, u.nombres, u.apellidos 
             FROM pedidos p 
             JOIN usuario u ON p.usuario_id = u.id 
             ORDER BY p.fecha DESC 
             LIMIT 10`
        );
        
        res.json({
            success: true,
            orders: orders
        });
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor' 
        });
    }
});

// 6. Obtener productos con stock bajo
router.get('/products/low-stock', requireAdmin, async (req, res) => {
    try {
        const [products] = await db.query(
            "SELECT * FROM productos WHERE stock <= stock_minimo ORDER BY stock ASC LIMIT 10"
        );
        
        res.json({
            success: true,
            products: products
        });
    } catch (error) {
        console.error('Error obteniendo productos stock bajo:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor' 
        });
    }
});

export default router;