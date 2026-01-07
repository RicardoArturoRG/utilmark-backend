import express from "express";
import {
  getAjustes,
  updateAjustes
} from "../controllers/ajustesController.js";

const router = express.Router();

router.get("/", getAjustes);
router.put("/", updateAjustes);

export default router;
