const { Router } = require("express");
const EntidadController = require("../../Controller/users/EntidadController.js");
const Authorization = require("../../middlewares/Authorization.js");

const EntidadRouter = Router();

// Add routes
EntidadRouter.get("/", Authorization, EntidadController.getAll);
EntidadRouter.post("/", Authorization, EntidadController.create);
EntidadRouter.get(
  "/dashboard",
  Authorization,
  EntidadController.getAllDashboard
);
EntidadRouter.put("/asignarrol", Authorization, EntidadController.UpdateRol);
EntidadRouter.get("/search", Authorization, EntidadController.Search);

module.exports = EntidadRouter;
