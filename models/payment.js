'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Payment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Payment.belongsTo(models.Booking, {
                foreignKey: 'booking_id',
                as: 'booking'
            });
        }
    }
    Payment.init({
        payment_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        booking_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'bookings',
                key: 'booking_id'
            }
        },
        payment_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0.01 // Check amount > 0
            }
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        transaction_id: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        payment_type: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'partial',
            validate: {
                isIn: [['deposit', 'partial', 'full', 'refund']]
            }
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'completed',
            validate: {
                isIn: [['pending', 'completed', 'failed', 'refunded']]
            }
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Payment',
        tableName: 'payments',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false // Only created_at is specified in the SQL
    });
    return Payment;
};
