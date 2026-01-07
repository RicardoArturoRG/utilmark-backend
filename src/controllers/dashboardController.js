// controllers/dashboardController.js
import { DashboardModel } from "../models/dashboardModel.js";

export const DashboardController = {
  async stats(req, res) {
    try {
      const [totalProductos, stockBajo, ventasMes, pedidosPendientes] = await Promise.all([
        DashboardModel.totalProductos(),
        DashboardModel.stockBajo(),
        DashboardModel.ventasMes(),
        DashboardModel.pedidosPendientes()
      ]);

      res.json({ 
        success: true,
        data: {
          totalProductos,
          stockBajo, 
          ventasMes,
          pedidosPendientes
        }
      });
    } catch (error) {
      console.error("Error en stats:", error);
      res.status(500).json({ 
        success: false,
        error: "Error al obtener estadísticas",
        message: error.message 
      });
    }
  },

  async ultimosProductos(req, res) {
    try {
      const productos = await DashboardModel.ultimosProductos();
      res.json({ 
        success: true,
        data: productos 
      });
    } catch (error) {
      console.error("Error en ultimosProductos:", error);
      res.status(500).json({ 
        success: false,
        error: "Error al obtener últimos productos",
        message: error.message
      });
    }
  },

  async ultimosPedidos(req, res) {
    try {
      const pedidos = await DashboardModel.ultimosPedidos();
      res.json({ 
        success: true,
        data: pedidos 
      });
    } catch (error) {
      console.error("Error en ultimosPedidos:", error);
      res.status(500).json({ 
        success: false,
        error: "Error al obtener últimos pedidos",
        message: error.message
      });
    }
  }
};