/**
 * Auto generated by MySQL Workbench Schema Exporter.
 * Version 3.0.3 (node-sequelize) on 2019-08-10 09:52:37.
 * Goto https://github.com/johmue/mysql-workbench-schema-exporter for more
 * information.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Rental', {
        rental_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        rental_date: {
            type: DataTypes.DATE
        },
        inventory_id: {
            type: DataTypes.INTEGER
        },
        customer_id: {
            type: DataTypes.INTEGER
        },
        return_date: {
            type: DataTypes.DATE
        },
        staff_id: {
            type: DataTypes.INTEGER
        },
        last_update: {
            type: DataTypes.DATE
        }
    }, {
        timestamps: false,
        underscored: true,
        tableName: 'rental',
        syncOnAssociation: false
    });
}