const isProduction = process.env.NODE_ENV === 'production';

const mpConfig = {
    // URLs según entorno
    getFrontendUrl() {
        if (isProduction) {
            return process.env.FRONTEND_URL || 'https://tudominio.com';
        }
        return process.env.FRONTEND_URL || 'http://localhost:5500';
    },
    
    // Configuración de MercadoPago según entorno
    getMercadoPagoConfig() {
        return {
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
            options: {
                timeout: 20000,
                idempotencyKey: isProduction ? undefined : `dev_${Date.now()}`
            }
        };
    },
    
    // Configuración de preferencia según entorno
    getPreferenceConfig(user, items, tipoEnvio) {
        const baseUrl = this.getFrontendUrl();
        
        return {
            items: items.map(item => ({
                id: item.id?.toString(),
                title: item.title?.substring(0, 100) || 'Producto',
                description: `Compra en ${isProduction ? 'Utilmark Perú' : 'Utilmark Dev'}`,
                quantity: Math.max(1, parseInt(item.quantity) || 1),
                currency_id: 'PEN',
                unit_price: Math.max(0.01, parseFloat(item.unit_price) || 0.01)
            })),
            payer: {
                email: user?.email || (isProduction ? 'cliente@utilmark.com' : 'dev@utilmark.com'),
                name: user?.nombres || 'Cliente',
                surname: user?.apellidos || ''
            },
            back_urls: {
                success: `${baseUrl}/success.html`,
                failure: `${baseUrl}/failure.html`,
                pending: `${baseUrl}/pending.html`
            },
            auto_return: isProduction ? 'approved' : undefined, // Solo en producción
            statement_descriptor: 'UTILMARK',
            binary_mode: isProduction, // true en producción, false en desarrollo
            external_reference: `order_${Date.now()}_${user?.id || 'guest'}`,
            notification_url: isProduction ? 
                `${process.env.BACKEND_URL}/api/mercado-pago/webhook` : undefined,
            expires: false,
            metadata: {
                environment: isProduction ? 'production' : 'development',
                user_id: user?.id,
                user_email: user?.email,
                tipo_envio: tipoEnvio || 'retiro'
            }
        };
    }
};

export default mpConfig;