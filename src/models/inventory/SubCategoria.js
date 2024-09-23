import { DataTypes } from "sequelize";

import { Model } from "sequelize";

class SubCategoria extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        nombre: {
          type: DataTypes.STRING,
        },
        descripcion: {
          type: DataTypes.STRING,
        },
      }, // attributes
      {
        sequelize,
        timestamps: false,
        tableName: "SubCategoria",
      }
    );

    return this;
  }
  static associate(models) {
    // Un Curso pertenece a un Usuario
    this.hasMany(models.Producto, {
      foreignKey: "SubCategoriaId",
      sourceKey: "id",
    });
    models.Producto.belongsTo(this, {
      foreignKey: "SubCategoriaId",
      targetKey: "id",
    });
  }
}

export default SubCategoria;
