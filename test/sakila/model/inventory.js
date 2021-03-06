/**
 * Auto generated by MySQL Workbench Schema Exporter.
 * Version 3.0.3 (node-sequelize) on 2019-08-10 09:52:37.
 * Goto https://github.com/johmue/mysql-workbench-schema-exporter for more
 * information.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Inventory', {
        inventory_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        film_id: {
            type: DataTypes.INTEGER
        },
        store_id: {
            type: DataTypes.INTEGER
        },
        last_update: {
            type: DataTypes.DATE
        }
    }, {
        timestamps: false,
        underscored: true,
        tableName: 'inventory',
        syncOnAssociation: false
    });
}