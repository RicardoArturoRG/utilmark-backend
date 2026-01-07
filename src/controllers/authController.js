// src/controllers/authController.js
import db from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ==================================================
// REGISTRO DE USUARIO
// ==================================================
export const register = async (req, res) => {
    try {
        const { nombres, apellidos, email, telefono, password, dni, ruc } = req.body;

        console.log('📝 Datos recibidos en registro:', {
            nombres, apellidos, email, 
            passLength: password ? password.length : 0
        });

        // ✅ VALIDACIÓN CORREGIDA (apellidos opcional)
        if (!nombres || !email || !password) {
            console.log('❌ Faltan datos:', { nombres, email, password });
            return res.status(400).json({ 
                success: false,
                message: "Nombre, email y contraseña son requeridos." 
            });
        }

        // Verificar si el email ya existe
        const [userExists] = await db.query(
            "SELECT id FROM usuario WHERE email = ?",
            [email]
        );

        if (userExists.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: "Este correo ya está registrado." 
            });
        }

        // Encriptar contraseña
        const passwordHash = await bcrypt.hash(password, 10);
        console.log('🔐 Hash generado');

        // Determinar rol - REGLA SIMPLE PARA ADMIN
        let role = "cliente";
        
        // Si el email contiene "admin" o es de utilmark.com -> ADMIN
        const emailLower = email.toLowerCase();
        if (emailLower.includes('admin') || emailLower.includes('utilmark.com')) {
            role = "admin";
            console.log('👑 Registrado como ADMIN');
        }

        // Insertar en BD (apellidos puede ser vacío)
        const [result] = await db.query(
            `INSERT INTO usuario 
            (nombres, apellidos, email, telefono, password_hash, dni, ruc, role, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombres, 
                apellidos || "",  // Permite vacío
                email, 
                telefono || "", 
                passwordHash, 
                dni || "", 
                ruc || "", 
                role, 
                "activo"
            ]
        );

        // Generar token
        const token = jwt.sign(
            { 
                id: result.insertId, 
                email: email,
                nombres: nombres,
                role: role,
                estado: "activo"
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Respuesta
        const response = {
            success: true,
            message: role === 'admin' 
                ? "¡Administrador registrado exitosamente!" 
                : "Usuario registrado exitosamente.",
            userId: result.insertId,
            role: role,
            token: token,
            user: {
                id: result.insertId,
                nombres: nombres,
                email: email,
                role: role,
                estado: "activo"
            }
        };

        // Si es admin
        if (role === 'admin') {
            response.isAdmin = true;
            response.redirectUrl = "/UTILMARK-ADMIN/index.html";
        }

        console.log('✅ Registro exitoso. ID:', result.insertId);
        return res.status(201).json(response);

    } catch (error) {
        console.error('❌ Error en registro:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error del servidor." 
        });
    }
};

// ==================================================
// LOGIN DE USUARIO
// ==================================================
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Email y contraseña requeridos." 
            });
        }

        // Buscar usuario
        const [user] = await db.query(
            "SELECT * FROM usuario WHERE email = ? LIMIT 1",
            [email]
        );

        if (user.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "Usuario no encontrado." 
            });
        }

        const usuarioData = user[0];

        // Verificar si el usuario está activo
        if (usuarioData.estado !== 'activo') {
            return res.status(403).json({
                success: false,
                message: "Tu cuenta está inactiva. Contacta al administrador."
            });
        }

        let isMatch = false;
        
        // CASO 1: Si tiene hash bcrypt (usuarios nuevos)
        if (usuarioData.password_hash && usuarioData.password_hash.startsWith('$2')) {
            isMatch = await bcrypt.compare(password, usuarioData.password_hash);
        }
        // CASO 2: Si no tiene hash (usuarios existentes) - MODO DESARROLLO
        else {
            console.log(`⚠️ Usuario ${email} sin hash bcrypt. Modo desarrollo activado.`);
            
            // Para desarrollo: acepta contraseñas planas
            const passwordsValidas = ['admin123', 'password123', '123456', 'admin', '12345678'];
            
            // Verificar si la contraseña es válida
                if (passwordsValidas.includes(password)) {
                isMatch = true;
                
                // IMPORTANTE: Actualizar a hash bcrypt automáticamente
                const newHash = await bcrypt.hash(password, 10);
                await db.query(
                    "UPDATE usuario SET password_hash = ? WHERE id = ?",
                    [newHash, usuarioData.id]
                );
                console.log(`✅ Hash actualizado para usuario ${email}`);
            }
        }

        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: "Contraseña incorrecta.",
                hint: "Prueba con: admin123, password123, 123456, admin, 12345678"
            });
        }

        // Generar token
        const token = jwt.sign(
            { 
                id: usuarioData.id, 
                email: usuarioData.email,
                nombres: usuarioData.nombres,
                apellidos: usuarioData.apellidos,
                role: usuarioData.role,
                estado: usuarioData.estado
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Preparar respuesta
        const response = {
            success: true,
            message: "Login exitoso.",
            token,
            user: {
                id: usuarioData.id,
                nombres: usuarioData.nombres,
                apellidos: usuarioData.apellidos,
                email: usuarioData.email,
                role: usuarioData.role,
                estado: usuarioData.estado
            }
        };

        // Si es admin, agregar información adicional
        if (usuarioData.role === 'admin') {
            response.isAdmin = true;
            response.message = "Login exitoso como administrador";
            response.redirectUrl = "/UTILMARK-ADMIN/index.html";
        }

        return res.json(response);

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error del servidor." 
        });
    }
};

// ==================================================
// VERIFICAR TOKEN
// ==================================================
export const verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                valid: false,
                message: "Token no proporcionado" 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuario en la base de datos para verificar que aún existe
        const [user] = await db.query(
            "SELECT id, nombres, apellidos, email, telefono, dni, ruc, role, estado FROM usuario WHERE id = ?",
            [decoded.id]
        );

        if (user.length === 0) {
            return res.status(404).json({ 
                success: false,
                valid: false,
                message: "Usuario no encontrado" 
            });
        }

        // Verificar que el usuario esté activo
        if (user[0].estado !== 'activo') {
            return res.status(403).json({
                success: false,
                valid: false,
                message: "Usuario inactivo"
            });
        }

        return res.json({
            success: true,
            valid: true,
            user: user[0]
        });

    } catch (error) {
        console.error('Error verificando token:', error);
        
        // Token expirado
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                valid: false,
                message: "Token expirado" 
            });
        }
        
        // Token inválido
        return res.status(401).json({ 
            success: false,
                valid: false,
                message: "Token inválido" 
        });
    }
};

// ==================================================
// PERFIL DE USUARIO
// ==================================================
export const getProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Token no proporcionado" 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Obtener perfil completo del usuario
        const [user] = await db.query(
            "SELECT id, nombres, apellidos, email, telefono, dni, ruc, role, estado, fecha_registro FROM usuario WHERE id = ?",
            [decoded.id]
        );

        if (user.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "Usuario no encontrado" 
            });
        }

        return res.json({
            success: true,
            user: user[0]
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: "Token expirado" 
            });
        }
        
        return res.status(401).json({ 
            success: false,
            message: "Token inválido o expirado" 
        });
    }
};

// ==================================================
// GOOGLE LOGIN - VERSIÓN SIMPLIFICADA
// ==================================================
export const googleLogin = async (req, res) => {
    console.log('🔐 === GOOGLE LOGIN ===');
    
    try {
        const { idToken } = req.body;
        
        console.log('✅ Token recibido?', !!idToken);
        console.log('📏 Longitud del token:', idToken ? idToken.length : 0);
        
        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'Token de Google requerido'
            });
        }
        
        // DECODIFICAR TOKEN MANUALMENTE
        console.log('🔓 Decodificando token JWT...');
        
        let payload;
        try {
            // Los tokens JWT tienen 3 partes: header.payload.signature
            const parts = idToken.split('.');
            if (parts.length !== 3) {
                throw new Error('Formato JWT inválido');
            }
            
            // Decodificar payload (parte del medio)
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
            payload = JSON.parse(jsonPayload);
            
            console.log('✅ Token decodificado exitosamente:');
            console.log('   📧 Email:', payload.email);
            console.log('   👤 Nombre:', payload.name);
            console.log('   🆔 Google ID:', payload.sub);
            console.log('   ✅ Email verificado:', payload.email_verified);
            
        } catch (decodeError) {
            console.error('❌ Error decodificando token:', decodeError.message);
            return res.status(401).json({
                success: false,
                message: 'Token de Google inválido'
            });
        }
        
        const userEmail = payload.email;
        const userName = payload.name || 'Usuario Google';
        
        console.log('📊 Datos del usuario:');
        console.log('   Email:', userEmail);
        console.log('   Nombre:', userName);
        
        // BUSCAR USUARIO EN BD
        console.log('🔍 Buscando usuario en base de datos...');
        
        const [userExists] = await db.query(
            "SELECT * FROM usuario WHERE email = ? LIMIT 1",
            [userEmail]
        );
        
        let usuario;
        let isNewUser = false;
        
        if (userExists.length === 0) {
            // CREAR NUEVO USUARIO
            console.log('👤 Usuario no existe. Creando nuevo...');
            
            // Determinar si es admin
            let role = "cliente";
            if (userEmail.includes('admin') || 
                userEmail.includes('utilmark') || 
                userEmail === 'admin@utilmark.com' ||
                userEmail === 'jairoalegreberdejo@gmail.com') {
                role = "admin";
                console.log('👑 Asignando rol ADMIN');
            }
            
            // Insertar usuario
            const [result] = await db.query(
                `INSERT INTO usuario 
                (nombres, email, password_hash, role, estado)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    userName,
                    userEmail,
                    'google_oauth_' + Date.now(),  // Contraseña placeholder
                    role,
                    'activo'
                ]
            );
            
            usuario = {
                id: result.insertId,
                nombres: userName,
                email: userEmail,
                role: role,
                estado: 'activo'
            };
            
            isNewUser = true;
            console.log('✅ Nuevo usuario creado. ID:', result.insertId, 'Rol:', role);
            
        } else {
            // USUARIO EXISTENTE
            usuario = userExists[0];
            console.log('✅ Usuario existente encontrado.');
            console.log('   ID:', usuario.id);
            console.log('   Rol:', usuario.role);
            console.log('   Estado:', usuario.estado);
        }
        
        // GENERAR JWT PARA TU SISTEMA
        console.log('🔑 Generando token JWT...');
        
        const tokenPayload = {
            id: usuario.id,
            email: usuario.email,
            nombres: usuario.nombres,
            role: usuario.role,
            estado: usuario.estado,
            provider: 'google',
            timestamp: Date.now()
        };
        
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET || 'dev_secret_key',
            { expiresIn: "7d" }
        );
        
        console.log('✅ Token JWT generado. Longitud:', token.length);
        
        // PREPARAR RESPUESTA
        const response = {
            success: true,
            message: isNewUser 
                ? '¡Usuario registrado con Google exitosamente!' 
                : '¡Login con Google exitoso!',
            token: token,
            user: {
                id: usuario.id,
                nombres: usuario.nombres,
                email: usuario.email,
                role: usuario.role,
                estado: usuario.estado,
                provider: 'google'
            },
            isNewUser: isNewUser,
            timestamp: new Date().toISOString()
        };
        
        if (usuario.role === 'admin') {
            response.isAdmin = true;
            response.message = '👑 ¡Administrador detectado! ' + response.message;
            console.log('🎯 Usuario identificado como ADMINISTRADOR');
        }
        
        console.log('🎉 Login exitoso. Enviando respuesta al frontend...');
        console.log('📤 Respuesta:', {
            success: response.success,
            userId: response.user.id,
            userEmail: response.user.email,
            userRole: response.user.role,
            isAdmin: response.isAdmin || false
        });
        
        return res.json(response);
        
    } catch (error) {
        console.error('💥 ERROR en googleLogin:');
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);
        
        return res.status(500).json({
            success: false,
            message: 'Error en autenticación con Google',
            error: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ==================================================
// GOOGLE LOGIN MOCK (SIEMPRE FUNCIONA)
// ==================================================
export const googleLoginMock = async (req, res) => {
    console.log('🎭 === GOOGLE LOGIN MOCK (SIEMPRE FUNCIONA) ===');
    
    try {
        const { idToken } = req.body;
        
        console.log('🧪 Modo mock activado');
        console.log('   Token recibido?', !!idToken);
        
        // Datos de prueba (siempre funciona)
        const mockUser = {
            id: 999,
            nombres: 'Jean Alegre Berdejo',
            email: 'jairoalegreberdejo@gmail.com',
            role: 'admin',
            estado: 'activo',
            provider: 'google'
        };
        
        // Decodificar token si existe (solo para logging)
        if (idToken && idToken.includes('.')) {
            try {
                const parts = idToken.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                    console.log('   Token decodificado (solo info):');
                    console.log('     Email real:', payload.email);
                    console.log('     Nombre real:', payload.name);
                    
                    // Usar datos reales si están disponibles
                    if (payload.email) mockUser.email = payload.email;
                    if (payload.name) mockUser.nombres = payload.name;
                }
            } catch (e) {
                // Ignorar errores en modo mock
            }
        }
        
        // Generar token real
        const token = jwt.sign(
            mockUser,
            process.env.JWT_SECRET || 'mock_secret_key',
            { expiresIn: "7d" }
        );
        
        console.log('✅ Mock login exitoso para:', mockUser.email);
        console.log('🔑 Token generado (', token.length, 'caracteres)');
        
        const response = {
            success: true,
            message: '✅ ¡Login con Google exitoso! (Modo desarrollo)',
            token: token,
            user: mockUser,
            isAdmin: true,
            isMock: true,
            redirectTo: '/panel-admin',
            timestamp: new Date().toISOString()
        };
        
        return res.json(response);
        
    } catch (error) {
        console.error('⚠️ Error en mock (no debería pasar):', error);
        
        // Fallback que SIEMPRE funciona
        return res.json({
            success: true,
            message: '✅ Login exitoso (fallback)',
            token: 'fallback_token_' + Date.now(),
            user: {
                id: 1,
                nombres: 'Admin Fallback',
                email: 'admin@fallback.com',
                role: 'admin',
                estado: 'activo'
            },
            isAdmin: true,
            isFallback: true
        });
    }
};

// ==================================================
// GOOGLE LOGIN SIN GUARDAR EN BD (SESIÓN TEMPORAL)
// ==================================================
export const googleLoginWithoutDB = async (req, res) => {
    console.log('🔐 === GOOGLE LOGIN SIN BASE DE DATOS ===');
    
    try {
        const { idToken } = req.body;
        
        console.log('✅ Token recibido?', !!idToken);
        
        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'Token de Google requerido'
            });
        }
        
        // DECODIFICAR TOKEN MANUALMENTE
        console.log('🔓 Decodificando token JWT de Google...');
        
        let payload;
        try {
            // Los tokens JWT tienen 3 partes: header.payload.signature
            const parts = idToken.split('.');
            if (parts.length !== 3) {
                throw new Error('Formato JWT inválido');
            }
            
            // Decodificar payload (parte del medio)
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
            payload = JSON.parse(jsonPayload);
            
            console.log('✅ Token decodificado exitosamente:');
            console.log('   📧 Email:', payload.email);
            console.log('   👤 Nombre:', payload.name);
            console.log('   🆔 Google ID:', payload.sub);
            console.log('   ✅ Email verificado:', payload.email_verified);
            
        } catch (decodeError) {
            console.error('❌ Error decodificando token:', decodeError.message);
            return res.status(401).json({
                success: false,
                message: 'Token de Google inválido'
            });
        }
        
        // VERIFICAR DATOS OBLIGATORIOS DE GOOGLE
        if (!payload.email || !payload.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email de Google no verificado'
            });
        }
        
        const userEmail = payload.email;
        const userName = payload.name || 'Usuario Google';
        
        console.log('🎯 Datos para sesión temporal:');
        console.log('   Email:', userEmail);
        console.log('   Nombre:', userName);
        
        // GENERAR JWT TEMPORAL SIN GUARDAR EN BD
        // - El usuario NO se almacena en la base de datos
        // - La sesión es válida solo mientras el token JWT sea válido
        
        // Determinar si es admin (por email específico)
        const isAdmin = userEmail === 'jairoalegreberdejo@gmail.com' || 
                       userEmail.includes('admin') || 
                       userEmail.includes('utilmark.com');
        
        const userRole = isAdmin ? 'admin' : 'user';
        
        console.log('👤 Rol asignado:', userRole);
        if (isAdmin) console.log('👑 ¡Administrador detectado!');
        
        // Crear objeto de usuario temporal
        const tempUser = {
            id: 'google_' + payload.sub, // Usar Google ID como identificador
            googleId: payload.sub,
            nombres: userName,
            email: userEmail,
            role: userRole,
            estado: 'activo',
            provider: 'google',
            noDB: true, // Marcar que NO está en BD
            picture: payload.picture || null
        };
        
        // Generar JWT para la sesión
        const token = jwt.sign(
            tempUser,
            process.env.JWT_SECRET || 'dev_secret_key',
            { expiresIn: "1d" } // Sesión de 1 día
        );
        
        console.log('✅ Token JWT temporal generado. Sesión válida por 1 día');
        console.log('📝 NOTA: Usuario NO se guarda en base de datos');
        
        // PREPARAR RESPUESTA
        const response = {
            success: true,
            message: '¡Sesión con Google iniciada exitosamente!',
            token: token,
            user: tempUser,
            isAdmin: isAdmin,
            sessionType: 'temporal',
            expiresIn: '1d',
            noDatabase: true,
            timestamp: new Date().toISOString()
        };
        
        console.log('🎉 Google Login sin BD exitoso. Enviando respuesta...');
        console.log('📤 Usuario:', {
            email: tempUser.email,
            role: tempUser.role,
            googleId: tempUser.googleId,
            noDB: tempUser.noDB
        });
        
        return res.json(response);
        
    } catch (error) {
        console.error('💥 ERROR en googleLoginWithoutDB:');
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);
        
        return res.status(500).json({
            success: false,
            message: 'Error en autenticación con Google',
            error: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ==================================================
// ACTUALIZAR PERFIL
// ==================================================
export const updateProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Token no proporcionado" 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { nombres, apellidos, telefono, dni, ruc } = req.body;

        // Actualizar datos del usuario
        await db.query(
            `UPDATE usuario 
             SET nombres = ?, apellidos = ?, telefono = ?, dni = ?, ruc = ?
             WHERE id = ?`,
            [nombres, apellidos, telefono || "", dni || "", ruc || "", decoded.id]
        );

        // Obtener usuario actualizado
        const [user] = await db.query(
            "SELECT id, nombres, apellidos, email, telefono, dni, ruc, role, estado FROM usuario WHERE id = ?",
            [decoded.id]
        );

        return res.json({
            success: true,
            message: "Perfil actualizado correctamente",
            user: user[0]
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error del servidor." 
        });
    }
};

// ==================================================
// CAMBIAR CONTRASEÑA
// ==================================================
export const changePassword = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Token no proporcionado" 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { currentPassword, newPassword } = req.body;

        // Verificar contraseña actual
        const [user] = await db.query(
            "SELECT password_hash FROM usuario WHERE id = ?",
            [decoded.id]
        );

        if (user.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "Usuario no encontrado" 
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user[0].password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: "Contraseña actual incorrecta" 
            });
        }

        // Encriptar nueva contraseña
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        await db.query(
            "UPDATE usuario SET password_hash = ? WHERE id = ?",
            [newPasswordHash, decoded.id]
        );

        return res.json({
            success: true,
            message: "Contraseña cambiada correctamente"
        });

    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        return res.status(500).json({ 
            success: false,
            message: "Error del servidor." 
        });
    }
};

// ==================================================
// VERIFICAR TOKEN PARA SESIONES SIN BD
// ==================================================
export const verifyTokenNoDB = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                valid: false,
                message: "Token no proporcionado" 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Para usuarios de Google sin BD, solo verificar el token JWT
        // No buscamos en la base de datos
        if (decoded.noDB) {
            return res.json({
                success: true,
                valid: true,
                user: decoded,
                noDatabase: true
            });
        } else {
            // Para usuarios con BD, hacer la verificación normal
            const [user] = await db.query(
                "SELECT id, nombres, apellidos, email, telefono, dni, ruc, role, estado FROM usuario WHERE id = ?",
                [decoded.id]
            );

            if (user.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    valid: false,
                    message: "Usuario no encontrado" 
                });
            }

            return res.json({
                success: true,
                valid: true,
                user: user[0]
            });
        }

    } catch (error) {
        console.error('Error verificando token:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                valid: false,
                message: "Token expirado" 
            });
        }
        
        return res.status(401).json({ 
            success: false,
            valid: false,
            message: "Token inválido" 
        });
    }
};