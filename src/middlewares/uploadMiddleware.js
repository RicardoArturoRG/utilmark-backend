import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 🔹 Necesario para usar __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ RUTA ABSOLUTA A src/uploads/products/img
const uploadPath = path.join(__dirname, "..", "uploads", "products", "img");

// Crear carpetas si no existen
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
        cb(null, uniqueName);
    }
});

export const upload = multer({ storage });
