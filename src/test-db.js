import db from "./config/db.js";

try {
    const [rows] = await db.query("SELECT 1+1 AS resultado");
    console.log("Conexión OK:", rows);
} catch (err) {
    console.error("Error de conexión:", err);
}
