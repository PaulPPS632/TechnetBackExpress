import Pedidos from "../../models/inventory/Pedidos.js";
class PedidosController {
  async register(req, res) {
    const { userId, productos, datospago, estado } = req.body;
    console.log(req.body);
    const resp = await Pedidos.create({
      fecha: new Date(),
      productos,
      datospago,
      estado,
      EntidadId: userId,
    });
    return res;
  }
  async getPedidos(req, res) {
    const { userId } = req.userId;
    const pedidos = await Pedidos.findAll({ where: userId });
    return res.json(pedidos);
  }
}

export default new PedidosController();
