// src/controllers/reclamosController.js
import nodemailer from 'nodemailer';

// Configurar transporter para emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Función para enviar reclamo
export const enviarReclamo = async (req, res) => {
    try {
        const {
            nombres,
            apellidos,
            nombre_completo,
            dni,
            telefono,
            email,
            direccion,
            fecha_hecho,
            tipo_reclamacion,
            numero_pedido,
            descripcion,
            pedido_consumidor,
            codigo_seguimiento
        } = req.body;

        console.log('📩 Reclamo recibido en backend:', {
            nombre_completo,
            email,
            tipo_reclamacion,
            codigo_seguimiento
        });

        // 1. OPCIONAL: Guardar en base de datos (si tienes tabla para reclamos)
        // const db = require('../config/db.js'); // Si necesitas DB
        
        // 2. ENVIAR EMAIL AL ADMINISTRADOR
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        
        // Mapear tipos de reclamación a nombres legibles
        const tiposMap = {
            'producto_defectuoso': 'Producto Defectuoso',
            'entrega_tardia': 'Entrega Tardía',
            'producto_incorrecto': 'Producto Incorrecto',
            'falta_producto': 'Falta de Producto',
            'mal_servicio': 'Mal Servicio',
            'facturacion': 'Problema de Facturación',
            'garantia': 'Garantía No Cumplida',
            'otro': 'Otro'
        };
        
        const tipoLegible = tiposMap[tipo_reclamacion] || tipo_reclamacion;

        const mailOptions = {
            from: `"UTILMARK - Sistema de Reclamos" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            cc: email, // Enviar copia al cliente
            subject: `📝 NUEVO RECLAMO: ${tipoLegible} - ${codigo_seguimiento}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
                        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { padding: 20px; }
                        .section { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
                        .section-title { color: #f44336; font-size: 18px; margin-bottom: 10px; }
                        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                        .info-item { background: #f9f9f9; padding: 10px; border-radius: 5px; }
                        .info-label { font-weight: bold; color: #555; }
                        .codigo { font-size: 24px; font-weight: bold; text-align: center; color: #f44336; padding: 15px; background: #fff5f5; border: 2px dashed #f44336; border-radius: 5px; margin: 20px 0; }
                        .urgent { color: #f44336; font-weight: bold; background: #fff5f5; padding: 10px; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📝 NUEVO RECLAMO RECIBIDO</h1>
                            <p>Libro de Reclamaciones - UTILMARK PERÚ</p>
                        </div>
                        
                        <div class="content">
                            <div class="codigo">
                                CÓDIGO DE SEGUIMIENTO: ${codigo_seguimiento}
                            </div>
                            
                            <div class="section">
                                <div class="section-title">📋 INFORMACIÓN DEL RECLAMANTE</div>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <div class="info-label">Nombre Completo:</div>
                                        <div>${nombre_completo}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">DNI:</div>
                                        <div>${dni}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Teléfono:</div>
                                        <div>${telefono}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Email:</div>
                                        <div>${email}</div>
                                    </div>
                                    <div class="info-item" style="grid-column: span 2;">
                                        <div class="info-label">Dirección:</div>
                                        <div>${direccion}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="section">
                                <div class="section-title">📄 DETALLES DEL RECLAMO</div>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <div class="info-label">Tipo de Reclamación:</div>
                                        <div>${tipoLegible}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Fecha del Hecho:</div>
                                        <div>${new Date(fecha_hecho).toLocaleDateString('es-ES')}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Número de Pedido:</div>
                                        <div>${numero_pedido || 'No especificado'}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Fecha de Envío:</div>
                                        <div>${new Date().toLocaleString('es-ES')}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="section">
                                <div class="section-title">📝 DESCRIPCIÓN DEL RECLAMO</div>
                                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                                    <div class="info-label" style="margin-bottom: 5px;">Hechos:</div>
                                    <div style="white-space: pre-wrap;">${descripcion}</div>
                                </div>
                                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
                                    <div class="info-label" style="margin-bottom: 5px;">Pedido del Consumidor:</div>
                                    <div style="white-space: pre-wrap;">${pedido_consumidor}</div>
                                </div>
                            </div>
                            
                            <div class="urgent">
                                ⚠️ REQUIERE ATENCIÓN: Este reclamo debe ser respondido en máximo 15 días hábiles según Ley N° 29571.
                            </div>
                            
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                                <p><strong>UTILMARK PERÚ</strong></p>
                                <p>📍 Av. Principal 123, Lima, Perú</p>
                                <p>📞 (01) 234-5678 | ✉️ reclamos@utilmark.pe</p>
                                <p>📋 RUC: 20123456789</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Enviar email
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de reclamo enviado a ${adminEmail} y copia a ${email}`);

        // 3. ENVIAR EMAIL DE CONFIRMACIÓN AL CLIENTE
        const confirmacionCliente = {
            from: `"UTILMARK - Confirmación de Reclamo" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `✅ Confirmación de Reclamo #${codigo_seguimiento}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0;">✅ RECLAMO RECIBIDO</h1>
                            <p style="margin: 5px 0 0 0;">UTILMARK PERÚ - Libro de Reclamaciones</p>
                        </div>
                        
                        <div style="padding: 20px;">
                            <p>Estimado/a <strong>${nombre_completo}</strong>,</p>
                            
                            <p>Hemos recibido tu reclamo en nuestro Libro de Reclamaciones Digital.</p>
                            
                            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                                <h3 style="margin: 0 0 10px 0; color: #2d3748;">📋 Información de tu Reclamo</h3>
                                <p><strong>Código de Seguimiento:</strong> <span style="font-size: 18px; font-weight: bold; color: #4CAF50;">${codigo_seguimiento}</span></p>
                                <p><strong>Tipo:</strong> ${tipoLegible}</p>
                                <p><strong>Fecha de Recepción:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                            </div>
                            
                            <h3>📝 ¿Qué sigue?</h3>
                            <ol style="padding-left: 20px;">
                                <li>Tu reclamo ha sido registrado en nuestro sistema</li>
                                <li>Nos pondremos en contacto contigo en máximo <strong>15 días hábiles</strong></li>
                                <li>Puedes usar tu código de seguimiento para cualquier consulta</li>
                            </ol>
                            
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeaa7;">
                                <h4 style="margin: 0 0 10px 0; color: #856404;">ℹ️ Información Importante</h4>
                                <p style="margin: 0;">Según la <strong>Ley N° 29571</strong> (Código de Protección al Consumidor), tenemos 15 días hábiles para responder a tu reclamo.</p>
                            </div>
                            
                            <p>Si tienes alguna pregunta adicional, contáctanos:</p>
                            <ul style="list-style-type: none; padding-left: 0;">
                                <li>📧 <strong>Email:</strong> reclamos@utilmark.pe</li>
                                <li>📞 <strong>Teléfono:</strong> (01) 234-5678</li>
                            </ul>
                            
                            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
                                Atentamente,<br>
                                <strong>Equipo de Atención al Cliente</strong><br>
                                UTILMARK PERÚ
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(confirmacionCliente);
        console.log(`✅ Email de confirmación enviado a ${email}`);

        // 4. RESPONDER AL FRONTEND
        res.json({
            success: true,
            message: "Reclamo procesado y enviado por email correctamente",
            codigo: codigo_seguimiento,
            email_cliente: email,
            email_admin: adminEmail,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en enviarReclamo:', error);
        
        // Enviar error detallado en desarrollo
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? error.message 
            : "Error al procesar el reclamo";
            
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};