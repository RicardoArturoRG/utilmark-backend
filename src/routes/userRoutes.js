import express from "express";
import { 
    getUsers, 
    getUserById, 
    createUser, 
    updateUser, 
    deleteUser,
    changeUserStatus 
} from "../controllers/userController.js";

const router = express.Router();

// GET /api/users - Obtener todos los usuarios
router.get("/", getUsers);

// GET /api/users/:id - Obtener un usuario por ID
router.get("/:id", getUserById);

// POST /api/users - Crear un nuevo usuario
router.post("/", createUser);

// PUT /api/users/:id - Actualizar usuario
router.put("/:id", updateUser);

// PATCH /api/users/:id/status - Cambiar estado del usuario
router.patch("/:id/status", changeUserStatus);
router.get('/users', userController.getUsers); // S
// DELETE /api/users/:id - Eliminar usuario
router.delete("/:id", deleteUser);

export default router;
