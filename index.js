const express = require('express');
const app = express();
const db = require('./db');

const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

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

app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set this to true if you're using https
  }));

app.get('/', (req, res) => {
        res.render('index', {})
})

app.get('/createAccount', (req, res) => {
    res.render('createAccount', {})
})

app.get('/login', function(req, res) {
    const sql = 'SELECT * FROM usuarios WHERE accountNum = ?';
    db.query(sql, [req.session.accountNum], function(err, results) {
        if (err) {
            console.log(err);
        } else if (results.length === 0) {
            console.log('Nenhum usuário encontrado com esse número de conta');
        } else {
            const user = results[0];
            if (!user.balance) {
                console.log('Usuário encontrado, mas sem saldo');
            }
            const sqlAllAccounts = 'SELECT * FROM usuarios WHERE nome != ?';
            db.query(sqlAllAccounts, [user.nome] , (err, accounts) => {
                if (err) {
                    console.log(err);
                } else {
                    const sqlExtract = 'SELECT * FROM transacoes WHERE accountNum = ?';
                    db.query(sqlExtract, [req.session.accountNum], (err, extract) => {
                        if (err) {
                            console.log(err);
                        } else {
                            res.render('login', {nome: user.nome, saldo: user.balance, accountNum: user.accountNum, contas: accounts, extrato: extract});
                        }
                    });
                }
            })
        }
    });
});

app.post('/', (req, res) => {
    const { name, password } = req.body;
    const sql = "SELECT * FROM usuarios WHERE nome = ? AND password = ?";
    db.query(sql, [name, password], (err, result) => {
        if(err) {
            console.log(err);
            res.status(500).send('Erro ao fazer login');
        } else if(result.length > 0) {
            const user = result[0];
            req.session.accountNum = user.accountNum;
            const sqlAllAccounts = "SELECT * FROM usuarios WHERE nome != ?"; // obter todas as contas
            db.query(sqlAllAccounts, [name], (err, accounts) => {
                if(err) {
                    console.log(err);
                    res.status(500).send('Erro ao buscar contas');
                } else {
                    const sqlExtract = 'SELECT * FROM transacoes WHERE accountNum = ?';
                    db.query(sqlExtract, [req.session.accountNum], (err, extract) => {
                        if (err) {
                            console.log(err);
                            res.status(500).send('Erro ao buscar extrato');
                        } else {
                            res.render('login', {nome: user.nome, saldo: user.balance, accountNum: user.accountNum, contas: accounts, extrato: extract});
                        }
                    });
                }
            });
        } else {
            res.status(401).send('Nome de usuário ou senha incorretos');
        }
    });
});

// Rota para criar uma conta
app.post('/createAccount', (req, res) => {
    const { name, accountNum, balance, password } = req.body;
    const sql = "INSERT INTO usuarios (nome, accountNum, balance, password) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, accountNum, balance, password], function (err, result) {
        if (err) {
            console.log(err);
            res.status(500).send('Erro ao criar a conta');
        } else { 
            req.session.accountNum = accountNum;
            const sqlAllAccounts = "SELECT * FROM usuarios WHERE nome != ?"; // obter todas as contas
            db.query(sqlAllAccounts, [name], (err, accounts) => {
                if(err) {
                    console.log(err);
                    res.status(500).send('Erro ao buscar contas');
                } else {
                    res.render('login', {nome: name, saldo: balance, accountNum: accountNum, contas: accounts});
                }
            });
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
            req.session.accountNum = accountNum;
            console.log(`Login bem-sucedido: ${accountNum}`);
            res.status(200).send('Login bem-sucedido');
        } else {
            res.status(401).send('Nome de usuário ou senha incorretos');
        }
    });
});

app.post('/transfer', (req, res) => {
    const val = parseFloat(req.body.val); // Convert the transfer value to a number
    const accountNum = req.body.accountNum;
    const source = req.session.accountNum
 

    const sqlTarget = 'SELECT * FROM usuarios WHERE accountNum = ?';
    db.query(sqlTarget, [accountNum], function (err, results) {
        if (err) {
            console.log(err);
        } else {
            const target = results[0].balance
            const sqlSource = 'SELECT * FROM usuarios WHERE accountNum = ?';
            db.query(sqlSource, [source], function (err, results) {
                if (err) {
                    console.log(err)
                } else {
                    const sourceBalance = results[0].balance
                    const newSource = sourceBalance - val
                    const newTarget = target + val
                    const sqlUpdateSource = 'UPDATE usuarios SET balance = ? WHERE accountNum = ?';
                    db.query(sqlUpdateSource, [newSource, source], function (err, results) {
                        if (err) {
                            console.log(err)
                        } else {
                            const sqlUpdateTarget = 'UPDATE usuarios SET balance = ? WHERE accountNum = ?';
                            db.query(sqlUpdateTarget, [newTarget, accountNum], function (err, results) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    const sqlInsertTransaction = 'INSERT INTO transacoes (valor, accountNum, tipo) VALUES (?,?,?)';
                                    db.query(sqlInsertTransaction, [val, accountNum, 'Recebimento (+)'], function (err, results) {
                                        if(err) {
                                            console.log(err)
                                        } else {
                                            db.query(sqlInsertTransaction, [val, source, 'Transferência (-)'], function (err, results) {
                                                if(err) {
                                                    console.log(err)
                                                } else {
                                                    res.redirect('/login')
                                                } 
                                            })
                                        }
                                    })
                                }           
                            });
                        }
                    });
                }
            });
        }
    });
});