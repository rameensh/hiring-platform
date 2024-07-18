const mysql = require('mysql');
var db = null;

module.exports = function () {
    if (!db) {
        db = mysql.createConnection({
            localhost: 'localhost',
            user: 'root',
            password: '',
            database: 'job_finder'
        });
    }
    return db;
};;