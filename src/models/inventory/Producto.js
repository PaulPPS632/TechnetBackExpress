import { Model, DataTypes } from "sequelize";

class Producto extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        nombre: {
          type: DataTypes.STRING,
        },
        pn: {
          type: DataTypes.STRING,
        },
        descripcion: {
          type: DataTypes.STRING,
        },
        garantia_cliente: {
          type: DataTypes.DOUBLE,
        },
        garantia_total: {
          type: DataTypes.DOUBLE,
        },
        stock: {
          type: DataTypes.DOUBLE,
        },
        precio: {
          type: DataTypes.DOUBLE,
        },
      }, // attributes
      {
        sequelize,
        timestamps: false,
        tableName: "Producto",
      }
    );

    return this;
  }
  static associate(models) {
    this.hasMany(models.ProductoSerie, {
      foreignKey: "ProductoId",
      sourceKey: "id",
    });
    models.ProductoSerie.belongsTo(this, {
      foreignKey: "ProductoId",
      targetKey: "id",
    });
  }
}

export default Producto;
