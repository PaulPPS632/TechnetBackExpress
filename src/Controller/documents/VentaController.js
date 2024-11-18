const Venta = require("../../models/documents/Venta.js");
const Producto = require("../../models/inventory/Producto.js");
const { Op, Sequelize } = require("sequelize");
const ProductoSerie = require("../../models/inventory/ProductoSerie.js");
const DetalleVenta = require("../../models/documents/DetalleVenta.js");
const Entidad = require("../../models/users/Entidad.js");
const SerieDetalleVenta = require("../../models/documents/SerieDetalleVenta.js");
class VentaController {
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
    if (documento_cliente == null || documento_cliente == "")
      return res.status(400).json({ message: "El cliente es requerido" });
    if (detalles.length === 0)
      return res.status(400).json({ message: "No hay productos en la venta" });
    try {
      const CompraRegist = await Venta.create({
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
        tipo_cambio: Math.round(tipo_cambio * 100) / 100,
        nota,
        impuesto: Math.round(impuesto * 100) / 100,
        gravada: Math.round(gravada * 100) / 100,
        total: Math.round(total * 100) / 100,
      });
      /*
      const productosIds = detalles.map((detalle) => detalle.id_producto);
      const productos = await Producto.findAll({
        where: {
          id: {
            [Op.in]: productosIds,
          },
        },
      });*/
      /*
      await Promise.all(
        detalles.map(async (detalle) => {
          const producto = productos.find((p) => p.id === detalle.id_producto);
          if (producto) {
            await Promise.all(
              detalle.series.map(async (serie) => {
                const producto_serie = await ProductoSerie.update(
                  {
                    EstadoProductoId: 2, // Datos a actualizar
                  },
                  {
                    where: {
                      sn: serie, // Condición
                    },
                  }
                );
                await DetalleVenta.create({
                  CompraId: CompraRegist.id,
                  ProductoSerieId: producto_serie.id,
                  sn: serie,
                  precio_neto: detalle.precio_unitario,
                });
              })
            );
          }
        })
      );*/
      await Promise.all(
        detalles.map(async (detalle) => {
          const detalleVenta = await DetalleVenta.create({
            VentaId: CompraRegist.id,
            series: detalle.series, // Guardar el array de series aquí
            precio_bruto:
              Math.round((detalle.precio_unitario / 1.18) * 100) / 100,
            precio_neto: Math.round(detalle.precio_unitario * 100) / 100,
            impuesto: Math.round(detalle.precio_total * 18) / 100,
            gravada: Math.round((detalle.precio_total / 1.18) * 100) / 100,
            total: Math.round(detalle.precio_total * 100) / 100,
            cantidad: detalle.cantidad,
          });

          await Promise.all(
            detalle.series.map(async (serie) => {
              await ProductoSerie.update(
                {
                  EstadoProductoId: 2, // Datos a actualizar
                },
                {
                  where: {
                    sn: serie, // Condición
                  },
                }
              );
              const serieActualizada = await ProductoSerie.findOne({
                where: { sn: serie },
              });
              await SerieDetalleVenta.create({
                DetalleVentaId: detalleVenta.id,
                ProductoSerieId: serieActualizada.id, // Estado de producto actualizado
              });
            })
          );
          await Producto.update(
            { stock: Sequelize.literal(`stock - ${detalle.cantidad}`) }, // Restar la cantidad vendida del stock
            { where: { id: detalle.id_producto } }
          );
        })
      );
      /*
      for (const producto of productos) {
        // Encontrar el detalle correspondiente por ID
        const detalle = detalles.find((d) => d.id_producto === producto.id);

        // Aumentar el stock del producto
        producto.stock -= detalle.cantidad;

        // Guardar el producto actualizado
        await producto.save();
      }*/
      return res.json({ message: "Venta Registrada Exitosamente" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error al registrar la compra", error });
    }
  }
  async GetAll(req, res) {
    const ventas = await Venta.findAll({
      include: [
        {
          model: Entidad,
          as: "entidadClienteVenta",
          attributes: ["nombre", "documento"],
        },
        {
          model: Entidad,
          as: "entidadNegocioVenta",
          attributes: ["nombre", "documento"],
        },
      ],
      attributes: ["id", "documento", "total", "fecha_emision"],
      order: [["createdAt", "DESC"]],
    });
    const respuesta = ventas.map((venta) => ({
      id: venta.id,
      documento: venta.documento,
      total: venta.total,
      fecha_emision: venta.fecha_emision,
      cliente: venta.entidadClienteVenta.nombre,
      cliente_documento: venta.entidadClienteVenta.documento,
      negocio: venta.entidadNegocioVenta.nombre,
      negocio_documento: venta.entidadNegocioVenta.documento,
    }));
    return res.status(200).json(respuesta);
  }
  async getById(req, res) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id no proporcionado" });
    const venta = await Venta.findOne({
      where: { id },

      include: [
        {
          model: DetalleVenta,
          as: "detalleventa",
          include: [
            {
              model: SerieDetalleVenta,
              as: "seriesDetalles",
              include: [
                {
                  model: ProductoSerie,
                  as: "productoSerie",
                  include: [
                    {
                      model: Producto,
                      as: "producto",
                      attributes: ["nombre", "id"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!venta) return res.status(404).json({ message: "Venta no encontrada" });
    // const detallesMap = {};

    // compra.DetalleCompras.forEach((detalle) => {
    //   const { ProductoId, sn } = detalle.ProductoSerie;
    //   if (!detallesMap[ProductoId]) {
    //     detallesMap[ProductoId] = {
    //       id_producto: ProductoId,
    //       nombre: "Nombre del producto", // Debes obtener el nombre real del producto si es necesario
    //       cantidad: 0,
    //       series: [],
    //       precio_unitario: detalle.precio_neto,
    //       precio_total: 0,
    //     };
    //   }
    //   detallesMap[ProductoId].cantidad += 1;
    //   detallesMap[ProductoId].series.push(sn);
    //   detallesMap[ProductoId].precio_total += detalle.precio_neto;
    // });
    // const detalles = Object.values(detallesMap);
    const detalles = venta.detalleventa.map((detalle) => ({
      id_producto: detalle.seriesDetalles[0].productoSerie.producto.id,
      nombre: detalle.seriesDetalles[0].productoSerie.producto.nombre,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_neto,
      precio_total: detalle.total,
      series: detalle.series,
    }));
    const ventaResponse = {
      id: venta.id,
      usuario_id: venta.EntidadNegocioId,
      documento_cliente: venta.EntidadId,
      documento: venta.documento,
      proveedor: venta.proveedor, // Asegúrate de incluir los datos del proveedor en la consulta
      usuario: venta.usuario, // Asegúrate de incluir los datos del usuario en la consulta
      tipocondicion: venta.TipoCondicion, // Asegúrate de incluir estos datos en la consulta
      tipopago: venta.TipoPago,
      tipomoneda: venta.TipoMoneda,
      tipo_cambio: venta.tipo_cambio,
      fecha_emision: venta.fecha_emision,
      fecha_vencimiento: venta.fecha_vencimiento,
      nota: venta.nota,
      gravada: venta.gravada,
      impuesto: venta.impuesto,
      total: venta.total,
      fechapago: venta.fecha_pago,
      formapago: venta.formapago,
      detalles: detalles,
    };
    return res.status(200).json(ventaResponse);
  }
  async getPaged(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const size = parseInt(req.query.size, 10) || 10;
    const offset = (page - 1) * size; // Calcular el offset (cuántos registros saltar)
    const limit = size; // Número de registros por página

    const { rows: documentos, count: total } = await Venta.findAndCountAll({
      include: [
        {
          model: Entidad,
          as: "entidadClienteVenta",
          attributes: ["nombre", "documento"],
        },
        {
          model: Entidad,
          as: "entidadNegocioVenta",
          attributes: ["nombre", "documento"],
        },
      ],
      attributes: ["id", "documento", "total", "fecha_emision"],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    const respuesta = documentos.map((venta) => ({
      id: venta.id,
      documento: venta.documento,
      total: venta.total,
      fecha_emision: venta.fecha_emision,
      cliente: venta.entidadClienteVenta.nombre,
      cliente_documento: venta.entidadClienteVenta.documento,
      negocio: venta.entidadNegocioVenta.nombre,
      negocio_documento: venta.entidadNegocioVenta.documento,
    }));

    res.status(200).json({
      documentos: respuesta,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit), // Calcular el total de páginas
    });
  }
}
module.exports = new VentaController();
