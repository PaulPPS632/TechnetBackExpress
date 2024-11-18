const { Router } = require("express");
const Authorization = require("../../middlewares/Authorization.js");
const VentaController = require("../../Controller/documents/VentaController.js");

const VentaRoutes = Router();

VentaRoutes.post("/", Authorization, VentaController.Register);
VentaRoutes.get("/", Authorization, VentaController.getPaged);
VentaRoutes.get("/:id", Authorization, VentaController.getById);
module.exports = VentaRoutes;
/**
 *     id: string;
    correlativo: CorrelativoResponse;
    cliente: Entidad;
    usuario: UserInfo;
    tipocondicion: TipoCondicion;
    tipopago: TipoPago;
    tipomoneda: TipoMoneda;
    tipo_cambio: number;
    fecha_emision: string[];
    fecha_vencimiento: string[];
    nota: string;
    gravada: number;
    impuesto: number;
    total: number;
    fechapago: string[];
    formapago: string;
 */
