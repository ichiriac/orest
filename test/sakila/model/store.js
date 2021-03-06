/**
 * Auto generated by MySQL Workbench Schema Exporter.
 * Version 3.0.3 (node-sequelize) on 2019-08-10 09:52:37.
 * Goto https://github.com/johmue/mysql-workbench-schema-exporter for more
 * information.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Store', {
        store_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        manager_staff_id: {
            type: DataTypes.INTEGER
        },
        address_id: {
            type: DataTypes.INTEGER
        },
        last_update: {
            type: DataTypes.DATE
        }
    }, {
        timestamps: false,
        underscored: true,
        tableName: 'store',
        syncOnAssociation: false
    });
}