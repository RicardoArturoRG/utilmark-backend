import db from "../config/db.js";

export const AjustesModel = {
  getAjustes: async () => {
    const [rows] = await db.query(
      "SELECT * FROM ajustes WHERE id = 1"
    );
    return rows[0];
  },

  updateAjustes: async (data) => {
    const {
      nombre_comercial,
      ruc,
      direccion,
      direccion_maps_url,
      telefono,
      email,
      horario_atencion,
      descripcion_sitio,
      envio_recojo_tienda,
      envio_local,
      envio_nacional,
      stock_minimo,
      igv,
      notificaciones_email,
      modo_mantenimiento
    } = data;

    const sql = `
      UPDATE ajustes SET
        nombre_comercial = ?,
        ruc = ?,
        direccion = ?,
        direccion_maps_url = ?,
        telefono = ?,
        email = ?,
        horario_atencion = ?,
        descripcion_sitio = ?,
        envio_recojo_tienda = ?,
        envio_local = ?,
        envio_nacional = ?,
        stock_minimo = ?,
        igv = ?,
        notificaciones_email = ?,
        modo_mantenimiento = ?
      WHERE id = 1
    `;

    const values = [
      nombre_comercial,
      ruc,
      direccion,
      direccion_maps_url,
      telefono,
      email,
      horario_atencion,
      descripcion_sitio,
      envio_recojo_tienda ? 1 : 0,
      envio_local ? 1 : 0,
      envio_nacional ? 1 : 0,
      stock_minimo,
      igv,
      notificaciones_email ? 1 : 0,
      modo_mantenimiento ? 1 : 0
    ];

    return db.query(sql, values);
  }
};
