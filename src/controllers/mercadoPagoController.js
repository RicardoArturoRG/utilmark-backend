import { MercadoPagoConfig, Preference } from 'mercadopago';

export const createPreference = async (req, res) => {
    console.log('🚀 [MP] Iniciando creación de pago...');
    
    try {
        // 1. Validaciones básicas
        const { items } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Carrito vacío'
            });
        }
        
        console.log(`📦 Procesando ${items.length} productos`);
        
        // 2. Configurar cliente MP
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
            options: { timeout: 10000 }
        });
        
        const preference = new Preference(client);
        
        // 3. Formatear items (MUY SIMPLE)
        const formattedItems = items.map((item, index) => ({
            id: item.id || `item_${index}`,
            title: (item.title || 'Producto').substring(0, 50),
            quantity: parseInt(item.quantity) || 1,
            currency_id: 'PEN',
            unit_price: parseFloat(item.unit_price) || 0.01
        }));
        
        // 4. **SOLUCIÓN: Crear preferencia SIN auto_return**
        // Este es el cambio CRÍTICO que hará que funcione
        
        const preferenceData = {
            items: formattedItems,
            payer: {
                email: req.user?.email || 'cliente@utilmark.com'
            },
            // URLs SIMPLES
            back_urls: {
    success: 'https://utilmark.pe/success.html',
    failure: 'https://utilmark.pe/failure.html'
},

            // ⚠️ NO USAR auto_return por ahora
            // auto_return: 'approved', // ← COMENTADO/ELIMINADO
            statement_descriptor: 'UTILMARK',
            binary_mode: false // false para sandbox
        };
        
        console.log('🔄 Creando preferencia en MercadoPago...');
        
        // 5. Crear la preferencia
        const result = await preference.create({ body: preferenceData });
        
        console.log('✅ ÉXITO! Preferencia creada:');
        console.log('🎫 ID:', result.id);
        console.log('🔗 Init Point:', result.init_point);
        
        // 6. Responder con la URL de pago
        res.json({
            success: true,
            id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point || result.init_point,
            // URL directa para redirección
            payment_url: result.sandbox_init_point || result.init_point
        });
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('🔍 Causa:', error.cause);
        
        // Si es error de auto_return, mostrar solución
        if (error.message.includes('auto_return')) {
            console.error('⚠️ SOLUCIÓN: Quitar auto_return de la configuración');
        }
        
        res.status(500).json({
            success: false,
            error: 'Error al crear pago: ' + error.message
        });
    }
};

export const test = (req, res) => {
    res.json({
        success: true,
        message: 'MP API OK',
        token: process.env.MERCADOPAGO_ACCESS_TOKEN ? 'Sí' : 'No'
    });
};