const Archivo = require("../../models/global/Archivo.js");
class ArchivoController {
  async Crear(req, res) {
    try {
      const tipoarchivo = req.body.tipo;
      if (req.files) {
        const prefijo = `${process.env.PATH_ARCHIVOS}/api/uploads`;
        const archivosSecundarios = await Promise.all(
          req.files.files.map(async (file) => {
            return await Archivo.create({
              url: `${prefijo}/${file.filename}`,
              descripcion: tipoarchivo,
              nombre: file.originalname,
              tipo_Archivo: "imagenes_publicitarias",
              ubicacion: file.destination,
            });
          })
        );
      }
      return res.status(201).json({
        message: `Imagenes de tipo ${tipoarchivo}, Creadas con Exito`,
      });
    } catch (error) {
      return res.status(500).json({ error: "Error en crear Imagenes", error });
    }
  }
  async DeleteImagen(req, res) {
    const { url } = req.body;
    if (url) {
      const archivo = await Archivo.findOne({ where: { url: url } });
      if (archivo) {
        await archivo.destroy();
        return res.status(200).json({ message: "Imagen Eliminada con Exito" });
      } else {
        return res.status(404).json({ message: "Imagen no encontrada" });
      }
    }
  }
  async getImagenesPublicitarias(req, res) {
    const archivos = await Archivo.findAll({
      where: { tipo_Archivo: "imagenes_publicitarias" },
      order: [["descripcion", "ASC"]],
    });

    // Agrupar por descripción y mapear URLs
    const respuesta = archivos.reduce((acc, archivo) => {
      const descripcion = archivo.descripcion || "Sin descripción";
      if (!acc[descripcion]) {
        acc[descripcion] = [];
      }
      acc[descripcion].push(archivo.url);
      return acc;
    }, {});
    return res.status(200).json(respuesta);
  }
}

module.exports = new ArchivoController();
