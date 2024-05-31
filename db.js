const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',  //localhost
    user: 'root',     //root
    password: '',   //senha
    database: 'banksystem'  //nome do banco
});

db.connect((err) => {
    if(err) console.log('Error connecting to database');
    else console.log('Database connected');
});

module.exports = db;