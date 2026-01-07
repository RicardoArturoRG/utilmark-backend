// src/routes/orderRoutes.js - VERSIÓN COMPLETA CORREGIDA
import express from "express";
import {
    createOrder,
    getOrdersByUser,
    getOrderDetail,
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
    getOrderStats,
    exportOrders
} from "../controllers/orderController.js";

const router = express.Router();

// =========================
// 📌 RUTAS PÚBLICAS/USUARIO
// =========================

// Crear nuevo pedido
router.post("/", createOrder);

// Obtener pedidos de un usuario específico
router.get("/user/:userId", getOrdersByUser);

// =========================
// 📌 RUTAS ADMIN (pedidosyenvios.html)
// =========================

// Obtener TODOS los pedidos (para panel admin)
router.get("/", getAllOrders);

// Obtener detalle de un pedido específico
router.get("/:orderId", getOrderDetail);

// Actualizar estado de un pedido
router.put("/:orderId", updateOrderStatus);

// Eliminar un pedido
router.delete("/:orderId", deleteOrder);

// =========================
// 📌 RUTAS ADICIONALES PARA ESTADÍSTICAS Y REPORTES
// =========================

// Obtener estadísticas de pedidos
router.get("/estadisticas/totales", getOrderStats);

// Exportar pedidos a CSV
router.get("/exportar/csv", exportOrders);

export default router;