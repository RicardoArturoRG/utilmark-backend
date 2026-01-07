import { AjustesModel } from "../models/ajustesModel.js";

export const getAjustes = async (req, res) => {
  try {
    const ajustes = await AjustesModel.getAjustes();
    res.json(ajustes || {});
  } catch (error) {
    res.status(500).json({ message: "Error al obtener ajustes" });
  }
};

export const updateAjustes = async (req, res) => {
  try {
    await AjustesModel.updateAjustes(req.body);
    res.json({ message: "Ajustes actualizados correctamente" });
  } catch (error) {
    console.error("ERROR REAL:", error);
    res.status(500).json({ message: "Error al actualizar ajustes" });
  }
};

