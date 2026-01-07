// backend/src/routes/mercadoPagoRoutes.js
import express from 'express';
import { createPreference, test } from '../controllers/mercadoPagoController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ruta de prueba (pública)
router.get('/test', test);

// Crear preferencia de pago (PROTEGIDA - requiere autenticación)
router.post('/create', verifyToken, createPreference);

export default router;