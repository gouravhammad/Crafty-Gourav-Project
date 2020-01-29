const mysql = require('mysql')

const connection = mysql.createConnection({
    host: 'remotemysql.com',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME,
    multipleStatements: true
})

connection.connect()

setInterval(keepAlive, 180000);
function keepAlive() {
    connection.query('SELECT 1');
    console.log("Fired Keep-Alive");
    return;
}

module.exports = connection