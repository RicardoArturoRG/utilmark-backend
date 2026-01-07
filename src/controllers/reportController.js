import { ReportModel } from "../models/reportModel.js";

export const ReportController = {
  getKPIs: async (req, res) => {
    try {
      const data = await ReportModel.getKPIs();
      res.json(data);
    } catch (error) {
      console.error("Error KPIs:", error);
      res.status(500).json({ message: "Error al obtener KPIs" });
    }
  },

  getVentasPorFecha: async (req, res) => {
  try {
    let { periodo, desde, hasta } = req.query;

    const hoy = new Date();
    let fechaInicio, fechaFin;

    if (desde && hasta) {
      fechaInicio = desde;
      fechaFin = hasta;
    } else {
      fechaFin = hoy.toISOString().split("T")[0];

      switch (periodo) {
        case "hoy":
          fechaInicio = fechaFin;
          break;
        case "semana":
          hoy.setDate(hoy.getDate() - 6);
          fechaInicio = hoy.toISOString().split("T")[0];
          break;
        case "anio":
          fechaInicio = `${hoy.getFullYear()}-01-01`;
          break;
        default: // mes
          fechaInicio = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
      }
    }

    const data = await ReportModel.getVentasPorFecha(fechaInicio, fechaFin);
    res.json(data);

  } catch (error) {
    console.error("Ventas por fecha:", error);
    res.status(500).json({ message: "Error al obtener ventas por fecha" });
  }
},


getProductosMasVendidos: async (req, res) => {
  try {
    const limite = req.query.limite ? parseInt(req.query.limite) : 5;
    const data = await ReportModel.getProductosMasVendidos(limite);
    res.json(data);
  } catch (error) {
    console.error("Error productos más vendidos:", error);
    res.status(500).json({ message: "Error al obtener productos más vendidos" });
  }
},

getClientesMasCompras: async (req, res) => {
  try {
    const limite = req.query.limite ? parseInt(req.query.limite) : 5;
    const data = await ReportModel.getClientesMasCompras(limite);
    res.json(data);
  } catch (error) {
    console.error("Error clientes más compras:", error);
    res.status(500).json({ message: "Error al obtener clientes con más compras" });
  }
},

getVentasPorMetodoPago: async (req, res) => {
  try {
    const data = await ReportModel.getVentasPorMetodoPago();
    res.json(data);
  } catch (error) {
    console.error("Error ventas por método de pago:", error);
    res.status(500).json({ message: "Error al obtener ventas por método de pago" });
  }
}



};