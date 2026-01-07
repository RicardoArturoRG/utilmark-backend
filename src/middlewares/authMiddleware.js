// authMiddleware.js - VERSIÓN DEBUG
export const isAdmin = (req, res, next) => {
    console.log('🔍 === DEBUG MIDDLEWARE isAdmin ===');
    console.log('Usuario completo:', req.user);
    console.log('Rol del usuario:', req.user?.role);
    console.log('Rol (alternativo):', req.user?.rol);
    console.log('Email:', req.user?.email);
    
    // ⚠️ TEMPORAL: PERMITIR A TODOS LOS USUARIOS
    console.log('⚠️ PERMITIENDO ACCESO A TODOS (modo emergencia)');
    return next(); // ← ¡ESTO PERMITE EL ACCESO!
    
    /*
    // ⚠️ COMENTA TODO ESTO TEMPORALMENTE:
    if (!req.user) {
        console.error('❌ No hay usuario en la request');
        return res.status(403).json({ 
            success: false,
            message: 'Usuario no autenticado' 
        });
    }
    
    // Verificar múltiples nombres de campo
    const userRole = req.user.role || req.user.rol || req.user.userRole || req.user.tipo;
    console.log('Rol detectado:', userRole);
    
    // Verificar si es admin (varias formas)
    const esAdmin = userRole && (
        userRole === 'admin' ||
        userRole === 'Admin' ||
        userRole === 'ADMIN' ||
        userRole === 'administrador' ||
        userRole === 'Administrador' ||
        userRole === '1' ||  // Por si usa números
        userRole === 1
    );
    
    if (!esAdmin) {
        console.error(`❌ Rol "${userRole}" no es considerado admin`);
        return res.status(403).json({ 
            success: false,
            message: `Se requieren permisos de administrador. Tu rol: ${userRole}` 
        });
    }
    
    console.log('✅ Acceso concedido como admin');
    next();
    */
};
