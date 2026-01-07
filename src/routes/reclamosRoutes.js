// src/routes/reclamosRoutes.js
import express from 'express';
import { enviarReclamo } from '../controllers/reclamosController.js';

const router = express.Router();

router.post('/enviar-reclamo', enviarReclamo);

export default router;