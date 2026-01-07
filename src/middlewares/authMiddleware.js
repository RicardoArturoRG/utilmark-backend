// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const verifyToken = async (req, res, next) => {
    try {
        console.log('🔐 Iniciando verificación de token...');
        
        // Obtener token del header
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            console.log('❌ No hay cabecera Authorization');
            return res.status(401).json({ 
                success: false,
                error: 'Acceso denegado. Token no proporcionado.' 
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            console.log('❌ Token no encontrado en cabecera');
            return res.status(401).json({ 
                success: false,
                error: 'Acceso denegado. Token no válido.' 
            });
        }
        
        console.log('📋 Token recibido:', token.substring(0, 20) + '...');
        
        // Verificar token - usando el mismo secreto que en authController.js
        const secret = process.env.JWT_SECRET || 'utilmark_secreto_jwt_2024';
        const decoded = jwt.verify(token, secret);
        
        console.log('✅ Token decodificado:', {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        });
        
        // IMPORTANTE: Si es usuario de Google sin BD (noDB), permitir continuar
        if (decoded.noDB) {
            console.log('👤 Usuario de Google sin BD, permitiendo acceso...');
            req.user = decoded;
            return next();
        }
        
        // Para usuarios con BD, verificar en la base de datos
        const [userRows] = await db.query(
            `SELECT id, nombres, apellidos, email, telefono, 
                    direccion_principal, distrito, provincia, departamento, 
                    dni, ruc, role, estado 
             FROM usuario WHERE id = ?`,
            [decoded.id]
        );
        
        if (userRows.length === 0) {
            console.log('❌ Usuario no encontrado en BD');
            return res.status(401).json({ 
                success: false,
                error: 'Usuario no encontrado.' 
            });
        }
        
        const user = userRows[0];
        
        if (user.estado !== 'activo') {
            console.log('❌ Usuario inactivo:', user.estado);
            return res.status(401).json({ 
                success: false,
                error: 'Cuenta desactivada.' 
            });
        }
        
        // Agregar usuario a la request
        req.user = {
            id: user.id,
            nombres: user.nombres,
            apellidos: user.apellidos,
            email: user.email,
            telefono: user.telefono,
            role: user.role,
            direccion_principal: user.direccion_principal,
            distrito: user.distrito,
            provincia: user.provincia,
            departamento: user.departamento,
            dni: user.dni,
            ruc: user.ruc
        };
        
        console.log('🎯 Usuario autenticado exitosamente:', req.user.email);
        next();
        
    } catch (error) {
        console.error('❌ Error en verifyToken:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ 
                success: false,
                error: 'Token inválido.' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                success: false,
                error: 'Token expirado. Inicia sesión nuevamente.' 
            });
        }
        
        return res.status(500).json({ 
            success: false,
            error: 'Error al verificar autenticación.' 
        });
    }
};