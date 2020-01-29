var MySql = require('sync-mysql');
 
var syncConnection = new MySql({
    host:'remotemysql.com',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME,
});

setInterval(keepAlive, 180000);

function keepAlive()
{
    syncConnection.query('SELECT 1');
    console.log("Sync-mysql Fired");
    return;
}
 
module.exports = syncConnection