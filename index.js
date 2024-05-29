const express = require('express');
const app = express();
const mysql = require('mysql');

const bodyParser = require('body-parser');
const path = require('path');

app.listen('3000', () => {
    console.log('Server is running on port 3000');
});

app.use(express.static(__dirname + '/public')); // alloy css

//body parser
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


//init mysql
const db = mysql.createConnection({
    host: 'localhost',  //localhost
    user: 'root',     //root
    password: '',   //senha
    database: 'banksystem'  //nome do banco
});

db.connect((err) => {
    if(err) console.log('Error connecting to database');
    else console.log('Database connected');
})

app.get('/', (req, res) => {
        res.render('index', {})
})

app.get('/createAccount', (req, res) => {
    res.render('createAccount', {})
})

app.get('/login', (req, res) => {
    res.render('login', {})
})

// Rota para criar uma conta
app.post('/createAccount', (req, res) => {
    const { name, accountNum, balance, password } = req.body;
    const sql = "INSERT INTO usuarios (nome, accountNum, balance, password) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, accountNum, balance, password], function (err, result) {
        if (err) {
            console.log(err);
            res.status(500).send('Erro ao criar a conta');
        } else { 
            console.log(`Conta criada: ${name}`);
            res.status(200).send('Conta criada com sucesso');
        }
    });
});

// Rota para fazer login
app.post('/login', (req, res) => {
    const { accountNum, password } = req.body;
    const sql = "SELECT * FROM usuarios WHERE accountNum = ? AND password = ?";
    db.query(sql, [accountNum, password], function (err, results) {
        if (err) {
            console.log(err);
            res.status(500).send('Erro ao fazer login');
        } else if (results.length > 0) {
            console.log(`Login bem-sucedido: ${accountNum}`);
            res.status(200).send('Login bem-sucedido');
        } else {
            res.status(401).send('Nome de usuário ou senha incorretos');
        }
    });
});
