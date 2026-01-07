// src/routes/authRoutes.js
import express from "express";
import { 
    register, 
    login, 
    verifyToken, 
    verifyTokenNoDB,
    getProfile,
    updateProfile,
    changePassword,
    googleLogin,
    googleLoginMock,
    googleLoginWithoutDB
} from '../controllers/authController.js';

const router = express.Router();

// ==================================================
// RUTAS PÚBLICAS (no requieren autenticación)
// ==================================================
router.post("/register", register);               // POST /api/auth/register
router.post("/login", login);                     // POST /api/auth/login
router.post("/google", googleLogin);              // POST /api/auth/google (con BD)
router.post("/google-mock", googleLoginMock);     // POST /api/auth/google-mock (mock)
router.post("/google-temp", googleLoginWithoutDB); // POST /api/auth/google-temp (sin BD)

// ==================================================
// RUTAS PROTEGIDAS (requieren token JWT)
// ==================================================
router.get("/verify", verifyToken);               // GET /api/auth/verify (para usuarios con BD)
router.get("/verify-no-db", verifyTokenNoDB);     // GET /api/auth/verify-no-db (para sin BD)
router.get("/profile", getProfile);               // GET /api/auth/profile
router.put("/profile", updateProfile);            // PUT /api/auth/profile
router.put("/change-password", changePassword);   // PUT /api/auth/change-password

export default router;