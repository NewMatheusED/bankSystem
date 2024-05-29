var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "banksystem"
})

app.post('/createAccount', function (req, res) {
    var name = req.body.name;
    var account_num = req.body.account_num;
    var balance = req.body.balance;
    var password = req.body.password;

    var sql =  "INSERT INTO usuarios (name, account_num, balance, password) VALUES (?, ?, ?, ?)";
    con.query(sql, [name, account_num, balance, password], function (err, result) {
        if (err) throw err;
        res.send('Account created');
    });
});

app.post('/login', function (req, res) {
    var account_num = req
})