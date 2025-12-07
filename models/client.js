'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Client extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Client.hasMany(models.Booking, {
                foreignKey: 'client_id',
                as: 'bookings'
            });
        }
    }
    Client.init({
        client_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Client',
        tableName: 'clients',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });
    return Client;
};
