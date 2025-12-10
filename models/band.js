'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Band extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Band.hasMany(models.Booking, {
                foreignKey: 'band_id',
                as: 'bookings'
            });
        }
    }
    Band.init({
        band_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        band_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        genre: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        number_of_members: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        contact_person: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        website: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        rating: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true,
            validate: {
                min: 0,
                max: 5
            }
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users', // Match the migration table name
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'Band',
        tableName: 'bands',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return Band;
};
