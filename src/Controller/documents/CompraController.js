const { Op } = require("sequelize");
const Compra = require("../../models/documents/Compra.js");
const ProductoSerie = require("../../models/inventory/ProductoSerie.js");
const Producto = require("../../models/inventory/Producto.js");
const DetalleCompra = require("../../models/documents/DetalleCompra.js");
const Entidad = require("../../models/users/Entidad.js");

class CompraController {
  async Register(req, res) {
    const {
      usuario_id,
      documento,
      documento_cliente,
      fecha_emision,
      fecha_vencimiento,
      fechapago,
      formapago,
      id_tipocondicion,
      id_tipomoneda,
      id_tipopago,
      tipo_cambio,
      nota,
      impuesto,
      gravada,
      total,
      detalles,
    } = req.body;
    console.log("datos ingreso: ", req.body);
    if (documento_cliente == null || documento_cliente == "")
      return res.status(400).json({ message: "El cliente es requerido" });
    if (detalles.length == 0)
      return res.status(400).json({ message: "No hay productos en la compra" });
    try {
      const seriesRegistradas = detalles.flatMap((detalle) => detalle.series);

      // Verificar si alguna de las series ya existe en la base de datos
      const seriesExistentes = await ProductoSerie.findAll({
        where: {
          sn: {
            [Op.in]: seriesRegistradas,
          },
        },
      });
      if (seriesExistentes.length > 0) {
        const seriesDuplicadas = seriesExistentes.map((serie) => serie.sn);
        return res.status(400).json({
          message: "Algunas series ya están registradas: " + seriesDuplicadas,
        });
      }
      const CompraRegist = await Compra.create({
        EntidadNegocioId: usuario_id,
        documento,
        EntidadId: documento_cliente,
        fecha_emision: new Date(fecha_emision),
        fecha_vencimiento: new Date(fecha_vencimiento),
        fechapago: new Date(fechapago),
        formapago,
        TipoCondicionId: id_tipocondicion,
        TipoMonedaId: id_tipomoneda,
        TipoPagoId: id_tipopago,
        tipo_cambio,
        nota,
        impuesto,
        gravada,
        total,
      });
      const productoIds = detalles.map((detalle) => detalle.id_producto);
      const productos = await Producto.findAll({
        where: {
          id: {
            [Op.in]: productoIds,
          },
        },
      });
      console.log("productos: ", productos);
      await Promise.all(
        detalles.map(async (detalle) => {
          const producto = productos.find((p) => p.id === detalle.id_producto);
          console.log("producto encontrado: ", producto);
          if (producto) {
            await Promise.all(
              detalle.series.map(async (serie) => {
                console.log("serie a ingresar: ", serie);
                console.log("producto.id: ", producto.id);
                const producto_serie = await ProductoSerie.create({
                  ProductoId: producto.id,
                  sn: serie,
                  EstadoProductoId: 1,
                });
                await DetalleCompra.create({
                  CompraId: CompraRegist.id,
                  ProductoSerieId: producto_serie.id,
                  sn: serie,
                  precio_neto: detalle.precio_unitario,
                });
              })
            );
          }
        })
      );
      for (const producto of productos) {
        // Encontrar el detalle correspondiente por ID
        const detalle = detalles.find((d) => d.id_producto === producto.id);

        // Aumentar el stock del producto
        producto.stock += detalle.cantidad;

        // Guardar el producto actualizado
        await producto.save();
      }
      return res.json({ message: "Compra Registrada Exitosamente" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error al registrar la compra", error });
    }
  }
  static addDetalleCompra(elemt) {}
  async GetAll(req, res) {
    const compras = await Compra.findAll({
      include: [
        {
          model: Entidad,
          as: "entidadClienteCompra",
          attributes: ["nombre", "documento"],
        },
        {
          model: Entidad,
          as: "entidadNegocioCompra",
          attributes: ["nombre", "documento"],
        },
      ],
      attributes: ["documento", "total", "fecha_emision"],
    });
    const respuesta = compras.map((venta) => ({
      documento: venta.documento,
      total: venta.total,
      fecha_emision: venta.fecha_emision,
      cliente: venta.entidadClienteCompra.nombre,
      cliente_documento: venta.entidadClienteCompra.documento,
      negocio: venta.entidadNegocioCompra.nombre,
      negocio_documento: venta.entidadNegocioCompra.documento,
    }));
    return res.status(200).json(respuesta);
  }
}

module.exports = new CompraController();
