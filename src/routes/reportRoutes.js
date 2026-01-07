import express from "express";
import { ReportController } from "../controllers/reportController.js";

const router = express.Router();

router.get("/kpis", ReportController.getKPIs);
router.get("/ventas-fecha", ReportController.getVentasPorFecha);
router.get("/productos-mas-vendidos", ReportController.getProductosMasVendidos);
router.get("/clientes-mas-compras", ReportController.getClientesMasCompras);
router.get("/ventas-metodo-pago", ReportController.getVentasPorMetodoPago);

export default router;
