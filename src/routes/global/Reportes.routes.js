const { Router } = require("express");
const ReportesController = require("../../Controller/global/ReportesController");
const ReportesRoutes = new Router();

ReportesRoutes.get("/", ReportesController.VentasxUsuario);
ReportesRoutes.get(
  "/productos-mas-vendidos",
  ReportesController.ProductosMasVendidos
);
module.exports = ReportesRoutes;
