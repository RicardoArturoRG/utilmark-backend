// routes/dashboardRoutes.js
import express from "express";
import { DashboardController } from "../controllers/dashboardController.js";

const router = express.Router();

// Asegúrate de que los métodos se llamen correctamente
router.get("/stats", (req, res) => DashboardController.stats(req, res));
router.get("/ultimos-productos", (req, res) => DashboardController.ultimosProductos(req, res));
router.get("/ultimos-pedidos", (req, res) => DashboardController.ultimosPedidos(req, res));

export default router;