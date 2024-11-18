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
      attributes: ["id", "documento", "total", "fecha_emision"],
      order: [["createdAt", "DESC"]],
    });
    const respuesta = compras.map((compra) => ({
      id: compra.id,
      documento: compra.documento,
      total: compra.total,
      fecha_emision: compra.fecha_emision,
      cliente: compra.entidadClienteCompra.nombre,
      cliente_documento: compra.entidadClienteCompra.documento,
      negocio: compra.entidadNegocioCompra.nombre,
      negocio_documento: compra.entidadNegocioCompra.documento,
    }));
    return res.status(200).json(respuesta);
  }

  async getById(req, res) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id no proporcionado" });
    const compra = await Compra.findOne({
      where: { id },
      include: [
        {
          model: DetalleCompra,
          include: [
            {
              model: ProductoSerie,
              attributes: ["ProductoId", "sn"],
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
    });

    if (!compra)
      return res.status(404).json({ message: "Compra no encontrada" });
    const detallesMap = {};

    compra.DetalleCompras.forEach((detalle) => {
      const { ProductoId, sn } = detalle.ProductoSerie;
      if (!detallesMap[ProductoId]) {
        detallesMap[ProductoId] = {
          id_producto: ProductoId,
          nombre: detalle.ProductoSerie.producto.nombre, // Debes obtener el nombre real del producto si es necesario
          cantidad: 0,
          series: [],
          precio_unitario: detalle.precio_neto,
          precio_total: 0,
        };
      }
      detallesMap[ProductoId].cantidad += 1;
      detallesMap[ProductoId].series.push(sn);
      detallesMap[ProductoId].precio_total += detalle.precio_neto;
    });
    const detalles = Object.values(detallesMap);
    const compraResponse = {
      id: compra.id,
      usuario_id: compra.EntidadNegocioId,
      documento_cliente: compra.EntidadId,
      documento: compra.documento,
      proveedor: compra.proveedor, // Asegúrate de incluir los datos del proveedor en la consulta
      usuario: compra.usuario, // Asegúrate de incluir los datos del usuario en la consulta
      tipocondicion: compra.TipoCondicion, // Asegúrate de incluir estos datos en la consulta
      tipopago: compra.TipoPago,
      tipomoneda: compra.TipoMoneda,
      tipo_cambio: compra.tipo_cambio,
      fecha_emision: compra.fecha_emision,
      fecha_vencimiento: compra.fecha_vencimiento,
      nota: compra.nota,
      gravada: compra.gravada,
      impuesto: compra.impuesto,
      total: compra.total,
      fechapago: compra.fecha_pago,
      formapago: compra.formapago,
      detalles,
    };
    return res.status(200).json(compraResponse);
  }
  async getPaged(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const size = parseInt(req.query.size, 10) || 10;
    const offset = (page - 1) * size; // Calcular el offset (cuántos registros saltar)
    const limit = size; // Número de registros por página

    const { rows: compras, count: total } = await Compra.findAndCountAll({
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
      attributes: ["id", "documento", "total", "fecha_emision"],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    const respuesta = compras.map((compra) => ({
      id: compra.id,
      documento: compra.documento,
      total: compra.total,
      fecha_emision: compra.fecha_emision,
      cliente: compra.entidadClienteCompra.nombre,
      cliente_documento: compra.entidadClienteCompra.documento,
      negocio: compra.entidadNegocioCompra.nombre,
      negocio_documento: compra.entidadNegocioCompra.documento,
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

module.exports = new CompraController();
