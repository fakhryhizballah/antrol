'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class trackersql extends Model {
    static associate(models) {
      // define association here
    }
  }
  trackersql.init({
    tanggal: {
      type: DataTypes.DATE,
      allowNull: false,
      primaryKey: true, 
    },
    sqle: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    usere: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'trackersql',
    tableName: 'trackersql',
    timestamps: false,
    createdAt: false,
    updatedAt: false,
  });
  return trackersql;
};