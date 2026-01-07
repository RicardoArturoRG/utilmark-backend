// src/services/emailService.js - ACTUALIZADO
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// DEPURACIÓN: Verificar variables
console.log('🔍 VERIFICANDO CREDENCIALES DE EMAIL:');
console.log('- EMAIL_USER:', process.env.EMAIL_USER || 'NO ENCONTRADO');
console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ CONFIGURADO (16 caracteres)' : '✗ NO CONFIGURADO');
console.log('- EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail (por defecto)');

// Validar credenciales
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ ERROR: Faltan credenciales en .env');
    console.error('   Asegúrate de que el archivo .env esté en la raíz del proyecto');
    console.error('   y tenga las variables EMAIL_USER y EMAIL_PASSWORD');
    process.exit(1);
}

// Crear transporter con configuración específica para Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verificar conexión
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ ERROR CONECTANDO CON GMAIL:');
        console.error('   Código:', error.code);
        console.error('   Mensaje:', error.message);
        console.error('\n📌 POSIBLES SOLUCIONES:');
        console.error('   1. La contraseña de aplicación debe estar sin espacios');
        console.error('   2. Verifica que la verificación en 2 pasos esté ACTIVADA');
        console.error('   3. Espera 5 minutos después de crear la contraseña de aplicación');
        console.error('   4. Prueba generando una NUEVA contraseña de aplicación');
    } else {
        console.log('✅ SERVIDOR DE EMAIL LISTO');
        console.log('   Email:', process.env.EMAIL_USER);
        console.log('   Servicio: Gmail');
    }
});


// =========================
// 📧 FUNCIONES DE ENVÍO DE EMAIL
// =========================

/**
 * Enviar correo de confirmación de pedido al cliente
 * @param {Object} orderData - Datos del pedido
 * @param {String} userEmail - Email del cliente
 */
export const sendOrderConfirmation = async (orderData, userEmail) => {
    try {
        const mailOptions = {
            from: `"UTILMARK" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `✅ Confirmación de Pedido #${orderData.id}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0;">UTILMARK</h1>
                            <h2 style="margin: 10px 0 0 0;">Confirmación de Pedido</h2>
                        </div>
                        
                        <div style="padding: 20px;">
                            <p>Hola <strong>${orderData.cliente_nombre || 'Cliente'}</strong>,</p>
                            <p>Gracias por tu compra en UTILMARK. Tu pedido ha sido recibido y está siendo procesado.</p>
                            
                            <h3>📦 Detalles del Pedido:</h3>
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <tr style="background-color: #f2f2f2;">
                                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Producto</th>
                                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Cantidad</th>
                                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Precio</th>
                                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Subtotal</th>
                                </tr>
                                ${orderData.productos.map(producto => `
                                    <tr>
                                        <td style="border: 1px solid #ddd; padding: 10px;">${producto.nombre || 'Producto'}</td>
                                        <td style="border: 1px solid #ddd; padding: 10px;">${producto.cantidad || 1}</td>
                                        <td style="border: 1px solid #ddd; padding: 10px;">S/ ${parseFloat(producto.precio || 0).toFixed(2)}</td>
                                        <td style="border: 1px solid #ddd; padding: 10px;">S/ ${parseFloat(producto.subtotal || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                                <tr style="font-weight: bold; font-size: 18px; color: #4CAF50;">
                                    <td colspan="3" style="text-align: right; border: 1px solid #ddd; padding: 10px;"><strong>Total:</strong></td>
                                    <td style="border: 1px solid #ddd; padding: 10px;"><strong>S/ ${parseFloat(orderData.total_pagar || 0).toFixed(2)}</strong></td>
                                </tr>
                            </table>
                            
                            <h3>📋 Información del Pedido:</h3>
                            <ul style="list-style-type: none; padding-left: 0;">
                                <li><strong>Número de Pedido:</strong> #${orderData.id}</li>
                                <li><strong>Fecha:</strong> ${new Date(orderData.fecha_creacion || new Date()).toLocaleDateString('es-ES')}</li>
                                <li><strong>Método de Pago:</strong> ${orderData.metodo_pago || 'No especificado'}</li>
                                <li><strong>Tipo de Entrega:</strong> ${orderData.metodo_entrega || 'Retiro en tienda'}</li>
                                <li><strong>Estado:</strong> Pendiente de pago</li>
                            </ul>
                            
                            <p>Te notificaremos cuando tu pedido sea enviado.</p>
                            
                            <p>Si tienes alguna pregunta, contáctanos en: <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a></p>
                        </div>
                        
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                            <p>Gracias por confiar en UTILMARK.</p>
                            <p>📍 Dirección: [Tu dirección aquí]</p>
                            <p>📞 Teléfono: [Tu teléfono aquí]</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Correo de confirmación enviado a: ${userEmail} para pedido #${orderData.id}`);
        
        return { success: true };
    } catch (error) {
        console.error('❌ Error enviando correo de confirmación:', error);
        return { success: false, error: error.message };
    }
};
// En emailService.js, actualiza o crea una nueva función:
export const sendReclamoNotification = async (reclamoData) => {
    try {
        const mailOptions = {
            from: `"UTILMARK - Reclamo" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `📝 NUEVO RECLAMO: ${reclamoData.asunto}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #f44336; color: white; padding: 15px;">
                            <h2 style="margin: 0;">📝 NUEVO RECLAMO RECIBIDO</h2>
                        </div>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #f44336;">
                            <h3 style="margin-top: 0;">📋 Información del Reclamo</h3>
                            <p><strong>ID:</strong> #${reclamoData.id}</p>
                            <p><strong>Cliente:</strong> ${reclamoData.cliente_nombre}</p>
                            <p><strong>Email:</strong> ${reclamoData.cliente_email}</p>
                            <p><strong>Teléfono:</strong> ${reclamoData.telefono_contacto || 'No especificado'}</p>
                            <p><strong>Asunto:</strong> ${reclamoData.asunto}</p>
                            <p><strong>Fecha:</strong> ${new Date(reclamoData.fecha_creacion).toLocaleString('es-ES')}</p>
                        </div>
                        
                        <div>
                            <h3>📄 Mensaje:</h3>
                            <div style="background-color: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                                <p style="white-space: pre-wrap;">${reclamoData.mensaje}</p>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <p style="color: #f44336; font-weight: bold;">⚠️ Requiere atención inmediata</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Notificación de reclamo enviada al administrador`);
        
        return { success: true };
    } catch (error) {
        console.error('❌ Error enviando notificación de reclamo:', error);
        return { success: false, error: error.message };
    }
};
/**
 * Enviar notificación de nuevo pedido al administrador
 * @param {Object} orderData - Datos del pedido
 */
export const sendAdminNotification = async (orderData) => {
    try {
        const mailOptions = {
            from: `"UTILMARK - Sistema" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: `🛒 NUEVO PEDIDO RECIBIDO #${orderData.id}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #ff9800; color: white; padding: 15px;">
                            <h2 style="margin: 0;">🚨 NUEVO PEDIDO RECIBIDO</h2>
                        </div>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50;">
                            <h3 style="margin-top: 0;">📋 Información del Pedido</h3>
                            <p><strong>Pedido #:</strong> ${orderData.id}</p>
                            <p><strong>Cliente:</strong> ${orderData.cliente_nombre || 'Cliente'}</p>
                            <p><strong>Email:</strong> ${orderData.cliente_email || 'No especificado'}</p>
                            <p><strong>Teléfono:</strong> ${orderData.telefono_contacto || 'No especificado'}</p>
                            <p><strong>Total:</strong> S/ ${parseFloat(orderData.total_pagar || 0).toFixed(2)}</p>
                        </div>
                        
                        <div>
                            <h3>🛍️ Productos:</h3>
                            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                                <tr style="background-color: #f2f2f2;">
                                    <th style="border: 1px solid #ddd; padding: 8px;">Producto</th>
                                    <th style="border: 1px solid #ddd; padding: 8px;">Cantidad</th>
                                    <th style="border: 1px solid #ddd; padding: 8px;">Precio</th>
                                </tr>
                                ${orderData.productos.map(p => `
                                    <tr>
                                        <td style="border: 1px solid #ddd; padding: 8px;">${p.nombre || 'Producto'}</td>
                                        <td style="border: 1px solid #ddd; padding: 8px;">${p.cantidad || 1}</td>
                                        <td style="border: 1px solid #ddd; padding: 8px;">S/ ${parseFloat(p.precio || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </table>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <p style="color: #ff0000; font-weight: bold;">⚠️ Acción requerida: Revisar y procesar el pedido.</p>
                            <p><a href="${process.env.BACKEND_URL || 'http://localhost:3000'}/api/orders/${orderData.id}">Ver pedido en panel admin</a></p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Notificación enviada al administrador para pedido #${orderData.id}`);
        
        return { success: true };
    } catch (error) {
        console.error('❌ Error enviando notificación al admin:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Enviar correo de actualización de estado
 * @param {Object} orderData - Datos del pedido
 * @param {String} userEmail - Email del cliente
 * @param {String} newStatus - Nuevo estado del pedido
 */
export const sendStatusUpdate = async (orderData, userEmail, newStatus) => {
    const statusMessages = {
        'preparacion': 'en preparación',
        'reparto': 'en camino',
        'entregado': 'entregado',
        'cancelado': 'cancelado'
    };
    
    const statusColors = {
        'preparacion': '#2196F3', // Azul
        'reparto': '#FF9800',     // Naranja
        'entregado': '#4CAF50',   // Verde
        'cancelado': '#F44336'    // Rojo
    };
    
    try {
        const mailOptions = {
            from: `"UTILMARK" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `📦 Actualización de Pedido #${orderData.id}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <div style="background-color: ${statusColors[newStatus] || '#4CAF50'}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0;">Actualización de Pedido</h1>
                        </div>
                        <div style="padding: 20px;">
                            <p>Hola ${orderData.cliente_nombre || 'Cliente'},</p>
                            <p>El estado de tu pedido <strong>#${orderData.id}</strong> ha sido actualizado:</p>
                            
                            <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid ${statusColors[newStatus] || '#4CAF50'}">
                                <h3 style="color: ${statusColors[newStatus] || '#4CAF50'}; margin: 0;">
                                    Nuevo Estado: ${statusMessages[newStatus] || newStatus}
                                </h3>
                            </div>
                            
                            <p><strong>Resumen del pedido:</strong></p>
                            <ul style="list-style-type: none; padding-left: 0;">
                                <li><strong>Total:</strong> S/ ${parseFloat(orderData.total_pagar || 0).toFixed(2)}</li>
                                <li><strong>Fecha:</strong> ${new Date(orderData.fecha_creacion || new Date()).toLocaleDateString('es-ES')}</li>
                            </ul>
                            
                            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                            <p>Gracias por tu compra!</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Correo de actualización enviado a ${userEmail} para pedido #${orderData.id}`);
        
        return { success: true };
    } catch (error) {
        console.error('❌ Error enviando correo de actualización:', error);
        return { success: false, error: error.message };
    }
};

// Función de prueba
export const testEmailService = async () => {
    try {
        const testMailOptions = {
            from: `"UTILMARK - Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: '✅ Prueba de Email Service',
            text: 'El servicio de email está funcionando correctamente!',
            html: '<h1>✅ Email Service Test</h1><p>El servicio de email está funcionando correctamente!</p>'
        };

        await transporter.sendMail(testMailOptions);
        console.log('✅ Email de prueba enviado correctamente');
        return { success: true };
    } catch (error) {
        console.error('❌ Error en test de email:', error);
        return { success: false, error: error.message };
    }
};

export default transporter;