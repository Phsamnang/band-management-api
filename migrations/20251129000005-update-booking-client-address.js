'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove start_time and end_time from bookings table (if they exist)
    const tableDescription = await queryInterface.describeTable('bookings');
    
    if (tableDescription.start_time) {
      await queryInterface.removeColumn('bookings', 'start_time');
    }
    
    if (tableDescription.end_time) {
      await queryInterface.removeColumn('bookings', 'end_time');
    }

    // Add address column to bookings table
    if (!tableDescription.address) {
      await queryInterface.addColumn('bookings', 'address', {
        type: Sequelize.STRING(200),
        allowNull: true
      });
    }

    // Remove address column from clients table
    const clientTableDescription = await queryInterface.describeTable('clients');
    
    if (clientTableDescription.address) {
      await queryInterface.removeColumn('clients', 'address');
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert: Add back start_time and end_time to bookings
    const tableDescription = await queryInterface.describeTable('bookings');
    
    if (!tableDescription.start_time) {
      await queryInterface.addColumn('bookings', 'start_time', {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '00:00:00'
      });
    }
    
    if (!tableDescription.end_time) {
      await queryInterface.addColumn('bookings', 'end_time', {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '23:59:59'
      });
    }

    // Revert: Remove address from bookings
    if (tableDescription.address) {
      await queryInterface.removeColumn('bookings', 'address');
    }

    // Revert: Add back address to clients
    const clientTableDescription = await queryInterface.describeTable('clients');
    
    if (!clientTableDescription.address) {
      await queryInterface.addColumn('clients', 'address', {
        type: Sequelize.STRING(200),
        allowNull: true
      });
    }
  }
};
