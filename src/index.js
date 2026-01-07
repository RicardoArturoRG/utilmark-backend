// ===================== IMPORTS =====================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

// ===================== CONFIG ENV =====================
dotenv.config();

// ===================== PATH SETUP =====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===================== APP INIT =====================
const app = express();

// ===================== MIDDLEWARES =====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================== STATIC FILES =====================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===================== REQUEST LOG =====================
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} ${req.method} ${req.url}`);
  if (req.method === "POST" || req.method === "PUT") {
    console.log("📦 Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// ===================== ROUTES IMPORT =====================
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ajustesRoutes from "./routes/ajustesRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import mercadoPagoRoutes from "./routes/mercadoPagoRoutes.js";
import reclamosRoutes from "./routes/reclamosRoutes.js";

// ===================== ROUTES REGISTER =====================
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/reportes", reportRoutes);
app.use("/api/ajustes", ajustesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/mercado-pago", mercadoPagoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reclamos", reclamosRoutes);

// ===================== BASIC ROUTES =====================
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend UTILMARK funcionando",
    status: "online",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "✅ Backend funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// ===================== EMAIL TEST =====================
app.get("/api/email/test", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"UTILMARK - Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "✅ Prueba de Email UTILMARK",
      html: `
        <h2>Email funcionando correctamente</h2>
        <p>Fecha: ${new Date().toLocaleString()}</p>
      `,
    });

    res.json({
      success: true,
      message: "Email de prueba enviado correctamente",
    });
  } catch (error) {
    console.error("❌ Error email:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ===================== DEBUG ROUTES =====================
app.get("/api/debug/routes", (req, res) => {
  const routes = [];

  const extractRoutes = (stack, prefix = "") => {
    stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods);
        routes.push({
          method: methods[0].toUpperCase(),
          path: prefix + layer.route.path,
        });
      } else if (layer.name === "router" && layer.handle.stack) {
        extractRoutes(layer.handle.stack, prefix);
      }
    });
  };

  extractRoutes(app._router.stack);

  res.json({
    total: routes.length,
    routes,
  });
});

// ===================== 404 HANDLER =====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// ===================== ERROR HANDLER =====================
app.use((err, req, res, next) => {
  console.error("❌ Error interno:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
});

// ===================== START SERVER =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("=========================================");
  console.log("🚀 Backend UTILMARK ONLINE");
  console.log(`🌍 Puerto: ${PORT}`);
  console.log(`📦 MySQL host: ${process.env.DB_HOST}`);
  console.log(`📧 Email activo: ${!!process.env.EMAIL_USER}`);
  console.log("=========================================");
});
