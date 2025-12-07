'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Booking extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Booking.belongsTo(models.Band, {
                foreignKey: 'band_id',
                as: 'band'
            });
            Booking.belongsTo(models.Client, {
                foreignKey: 'client_id',
                as: 'client'
            });
            Booking.hasMany(models.Payment, {
                foreignKey: 'booking_id',
                as: 'payments'
            });
        }
    }
    Booking.init({
        booking_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        band_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'bands',
                key: 'band_id'
            }
        },
        client_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clients',
                key: 'client_id'
            }
        },
        event_type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        event_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        address: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'confirmed', 'cancelled', 'completed']]
            }
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        deposit_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        balance_due: {
            type: DataTypes.DECIMAL(10, 2),
            // This field is generated in the database. 
            // We define it here to be able to read it, but we shouldn't write to it.
        },
        special_requests: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Booking',
        tableName: 'bookings',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return Booking;
};
