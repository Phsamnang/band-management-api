'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if first_name and last_name columns exist
    const tableDescription = await queryInterface.describeTable('clients');
    
    // Add name column (temporarily allow null to migrate data)
    await queryInterface.addColumn('clients', 'name', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // If first_name and last_name exist, migrate data to name (PostgreSQL syntax)
    if (tableDescription.first_name && tableDescription.last_name) {
      await queryInterface.sequelize.query(`
        UPDATE clients 
        SET name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
        WHERE name IS NULL
      `);
      
      // Remove first_name and last_name columns
      await queryInterface.removeColumn('clients', 'first_name');
      await queryInterface.removeColumn('clients', 'last_name');
    } else {
      // If no first_name/last_name, set a default value for existing records
      await queryInterface.sequelize.query(`
        UPDATE clients 
        SET name = 'Client'
        WHERE name IS NULL
      `);
    }

    // Make name column NOT NULL after data migration
    await queryInterface.changeColumn('clients', 'name', {
      type: Sequelize.STRING(100),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Add back first_name and last_name columns
    await queryInterface.addColumn('clients', 'first_name', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    
    await queryInterface.addColumn('clients', 'last_name', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    // Split name back to first_name and last_name (PostgreSQL syntax)
    await queryInterface.sequelize.query(`
      UPDATE clients 
      SET first_name = SPLIT_PART(name, ' ', 1),
          last_name = CASE 
            WHEN POSITION(' ' IN name) > 0 
            THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
            ELSE ''
          END
      WHERE name IS NOT NULL
    `);

    // Remove name column
    await queryInterface.removeColumn('clients', 'name');
  }
};

