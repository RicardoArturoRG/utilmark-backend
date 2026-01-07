
import { ProductModel } from "../models/productModel.js";
import fs from "fs";
import path from "path";


export const ProductController = {
    getAll: async (req, res) => {
        try {
            const productos = await ProductModel.getAll();
            res.json(productos);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener productos" });
        }
    },

    create: async (req, res) => {
        try {
            // Ruta pública que verá el frontend
            const imagen_url = req.file ? "products/img/" + req.file.filename : null;

            const id = await ProductModel.create({
                ...req.body,
                imagen_url
            });

            res.json({ message: "Producto creado", id });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error al crear producto" });
        }
    },
    update: async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await ProductModel.getById(id);
        if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

        // 🔥 SOLUCIÓN: Obtener solo los campos que realmente se envían
        const data = {};
        
        // Lista de campos permitidos para actualizar
        const camposPermitidos = ['nombre', 'descripcion', 'categoria_id', 'precio', 'stock', 'marca', 'sku', 'activo', 'destacado', 'en_promocion'];
        
        // Solo agregar campos que vienen en req.body y no están vacíos
        for (const campo of camposPermitidos) {
            if (req.body[campo] !== undefined && req.body[campo] !== '') {
                data[campo] = req.body[campo];
            }
        }

        // 🔥 CLAVE: Si no hay campos en req.body, usar los valores actuales
        if (Object.keys(data).length === 0) {
            // Obtener solo los campos que están en el formulario
            const formData = { ...req.body };
            
            // Si algún campo viene vacío (""), usar el valor actual del producto
            for (const campo of camposPermitidos) {
                if (formData[campo] === '') {
                    data[campo] = producto[campo];
                } else if (formData[campo] !== undefined) {
                    data[campo] = formData[campo];
                }
            }
        }

        // Imagen opcional
        if (req.file) {
            // Borrar anterior
            if (producto.imagen_url) {
                const imgPath = path.join("src", "uploads", producto.imagen_url);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
            data.imagen_url = "products/img/" + req.file.filename;
        }

        // 🔥 ASEGURAR que siempre haya campos para actualizar
        if (Object.keys(data).length === 0) {
            // Si aún no hay campos, usar valores actuales para campos básicos
            data.nombre = producto.nombre;
            data.descripcion = producto.descripcion || '';
            data.categoria_id = producto.categoria_id;
            data.precio = producto.precio;
            data.stock = producto.stock;
        }

        const result = await ProductModel.update(id, data);

        res.json({ message: "Producto actualizado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || "Error al actualizar producto" });
    }
},


     delete: async (req, res) => {
        try {
            const { id } = req.params;

            // obtener producto (para borrar imagen)
            const producto = await ProductModel.getById(id);
            if (!producto) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }

            // borrar imagen si existe
            if (producto.imagen_url) {
                const imgPath = path.join("src", "uploads", producto.imagen_url);
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath);
                }
            }

            await ProductModel.delete(id);
            res.json({ message: "Producto eliminado" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error al eliminar producto" });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const producto = await ProductModel.getById(id);

            if (!producto) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }

            res.json(producto);
        } catch (err) {
            res.status(500).json({ error: "Error al obtener producto" });
        }
    },

    

};