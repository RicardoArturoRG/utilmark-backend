// src/models/userModel.js
import db from "../config/db.js";

export const UserModel = {
    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM usuario");
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query("SELECT * FROM usuario WHERE id = ?", [id]);
        return rows[0];
    },

    create: async ({ nombres, apellidos, email, telefono, password_hash, dni, ruc, role }) => {
        const [result] = await db.query(
            `INSERT INTO usuario 
             (nombres, apellidos, email, telefono, password_hash, dni, ruc, role) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombres, apellidos, email, telefono, password_hash, dni || "", ruc || "", role || "cliente"]
        );
        return result.insertId;
    },

    update: async (id, { nombres, apellidos, email, telefono, password_hash, dni, ruc, role }) => {
        await db.query(
            `UPDATE usuario SET nombres=?, apellidos=?, email=?, telefono=?, password_hash=?, dni=?, ruc=?, role=? WHERE id=?`,
            [nombres, apellidos, email, telefono, password_hash, dni, ruc, role, id]
        );
    },

    changeStatus: async (id, estado) => {
        await db.query("UPDATE usuario SET estado=? WHERE id=?", [estado, id]);
    },

    delete: async (id) => {
        await db.query("DELETE FROM usuario WHERE id=?", [id]);
    },

    findByEmail: async (email) => {
        const [rows] = await db.query("SELECT * FROM usuario WHERE email = ?", [email]);
        return rows[0];
    }
};
