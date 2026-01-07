import express from "express";
import { ProductController } from "../controllers/productController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getById);
router.post("/", upload.single("imagen"), ProductController.create);
router.put("/:id", upload.single("imagen"), ProductController.update);
router.delete("/:id", ProductController.delete);

export default router;
