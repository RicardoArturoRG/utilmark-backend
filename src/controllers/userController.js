import { UserModel } from '../models/userModel.js';
// Al inicio de userController.js, después de los imports
// ✅ CORRECCIÓN 2: Si NO es export default
import { db } from '../config/db.js'; // Con llaves

import { UserModel } from '../models/userModel.js';

// En userController.js - getUsers function CORREGIDA
export const getUsers = async (req, res) => {
    try {
        console.log('🎯 GET /api/users - Usuario:', req.user?.email || 'No user');
        
        // ⚠️ MODO EMERGENCIA: Sin verificación
        console.log('🔓 Acceso concedido sin verificación');
        
        // OPCIÓN 1: Usar UserModel si tiene getAll()
        // const users = await UserModel.getAll();
        
        // OPCIÓN 2: Conexión directa SIN import db
        // Necesitarías importar mysql2/promise aquí
        import('mysql2/promise').then(async (mysql) => {
            const connection = await mysql.createConnection({
                host: process.env.MYSQLHOST,
                port: process.env.MYSQLPORT,
                user: process.env.MYSQLUSER,
                password: process.env.MYSQLPASSWORD,
                database: process.env.MYSQLDATABASE
            });
            
            const [users] = await connection.execute(`
                SELECT id, nombres, email, role, estado
                FROM usuario 
                ORDER BY id DESC
                LIMIT 50
            `);
            
            await connection.end();
            
            res.json({
                success: true,
                count: users.length,
                data: users
            });
        }).catch(error => {
            console.error('❌ Error de MySQL:', error);
            res.status(500).json({ error: error.message });
        });
        
    } catch (error) {
        console.error('❌ Error en getUsers:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message 
        });
    }
};

// ... resto de las funciones (getUserById, createUser, etc.) ...
// Obtener un usuario por ID
export const getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const usuario = await UserModel.getById(userId);
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }
        
        // Formatear el usuario
        const usuarioFormateado = {
            id: usuario.id,
            nombre: `${usuario.nombres} ${usuario.apellidos}`.trim(),
            email: usuario.email,
            rol: usuario.role || 'cliente',
            estado: usuario.estado || 'Activo',
            fechaRegistro: usuario.created_at ? 
                new Date(usuario.created_at).toISOString().split('T')[0] : 
                '2024-01-01',
            telefono: usuario.telefono || '',
            dni: usuario.dni || '',
            ruc: usuario.ruc || '',
            direccion: usuario.direccion || '',
            ciudad: usuario.ciudad || ''
        };
        
        res.status(200).json({
            success: true,
            data: usuarioFormateado
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener usuario",
            error: error.message
        });
    }
};

// Crear un nuevo usuario
export const createUser = async (req, res) => {
    try {
        const { 
            nombres, 
            apellidos, 
            email, 
            telefono, 
            password_hash, 
            dni, 
            ruc, 
            role 
        } = req.body;
        
        // Validaciones básicas
        if (!nombres || !apellidos || !email || !password_hash) {
            return res.status(400).json({
                success: false,
                message: "Nombre, apellido, email y contraseña son obligatorios"
            });
        }
        
        const newUserId = await UserModel.create({
            nombres,
            apellidos,
            email,
            telefono: telefono || '',
            password_hash,
            dni: dni || '',
            ruc: ruc || '',
            role: role || 'cliente'
        });
        
        // Obtener el usuario creado
        const nuevoUsuario = await UserModel.getById(newUserId);
        
        res.status(201).json({
            success: true,
            message: "Usuario creado exitosamente",
            data: {
                id: nuevoUsuario.id,
                nombre: `${nuevoUsuario.nombres} ${nuevoUsuario.apellidos}`.trim(),
                email: nuevoUsuario.email,
                rol: nuevoUsuario.role,
                estado: nuevoUsuario.estado || 'Activo'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al crear usuario",
            error: error.message
        });
    }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { 
            nombres, 
            apellidos, 
            email, 
            telefono, 
            password_hash, 
            dni, 
            ruc, 
            role,
            estado 
        } = req.body;
        
        // Verificar si el usuario existe
        const usuarioExistente = await UserModel.getById(userId);
        if (!usuarioExistente) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }
        
        await UserModel.update(userId, {
            nombres: nombres || usuarioExistente.nombres,
            apellidos: apellidos || usuarioExistente.apellidos,
            email: email || usuarioExistente.email,
            telefono: telefono || usuarioExistente.telefono,
            password_hash: password_hash || usuarioExistente.password_hash,
            dni: dni || usuarioExistente.dni,
            ruc: ruc || usuarioExistente.ruc,
            role: role || usuarioExistente.role
        });
        
        // Si se proporciona estado, actualizarlo
        if (estado) {
            await UserModel.changeStatus(userId, estado);
        }
        
        // Obtener el usuario actualizado
        const usuarioActualizado = await UserModel.getById(userId);
        
        res.status(200).json({
            success: true,
            message: "Usuario actualizado exitosamente",
            data: {
                id: usuarioActualizado.id,
                nombre: `${usuarioActualizado.nombres} ${usuarioActualizado.apellidos}`.trim(),
                email: usuarioActualizado.email,
                rol: usuarioActualizado.role,
                estado: usuarioActualizado.estado
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar usuario",
            error: error.message
        });
    }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Verificar si el usuario existe
        const usuarioExistente = await UserModel.getById(userId);
        if (!usuarioExistente) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }
        
        await UserModel.delete(userId);
        
        res.status(200).json({
            success: true,
            message: "Usuario eliminado exitosamente",
            data: {
                id: usuarioExistente.id,
                nombre: `${usuarioExistente.nombres} ${usuarioExistente.apellidos}`.trim(),
                email: usuarioExistente.email
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al eliminar usuario",
            error: error.message
        });
    }
};

// Cambiar estado de usuario
export const changeUserStatus = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { estado } = req.body;
        
        if (!estado) {
            return res.status(400).json({
                success: false,
                message: "El estado es requerido"
            });
        }
        
        // Verificar si el usuario existe
        const usuarioExistente = await UserModel.getById(userId);
        if (!usuarioExistente) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }
        
        await UserModel.changeStatus(userId, estado);
        
        res.status(200).json({
            success: true,
            message: `Estado actualizado a: ${estado}`,
            data: {
                id: userId,
                estado: estado
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al cambiar estado",
            error: error.message
        });
    }
};
