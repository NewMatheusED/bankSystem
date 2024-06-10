const express = require('express');
const app = express();
const db = require('./db');
const bcrypt = require('bcrypt');

const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

app.listen('3000', () => {
    console.log('Server is running on port 3000');
});

//body parser
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));  // alloy css

app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set this to true if you're using https
  }));

function renderLogin(req, res, error = '') {
    const sql = 'SELECT * FROM usuarios WHERE accountNum = ?';
    db.query(sql, [req.session.accountNum], function(err, results) {
        if (err) {
            console.log(err);
        } else if (results.length === 0) {
            console.log('Nenhum usuário encontrado com esse número de conta');
        } else {
            const user = results[0];
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
                            res.render('login', {nome: user.nome, saldo: user.balance, accountNum: user.accountNum, contas: accounts, extrato: extract, error: error});
                        }
                    });
                }
            })
        }
    });
}

function renderIndex(req, res, error = '') {
    const sql = 'SELECT * FROM usuarios'
    db.query(sql, (err, rows) => {
        if (err) {
            console.log(err)
        } else {
            res.render('index', {accounts: rows, error: error})
        }
    })
}

app.get('/', (req, res) => {
    renderIndex(req, res)
})

app.get('/createAccount', (req, res) => {
    res.render('createAccount', {})
})

app.get('/login', function(req, res) {
    renderLogin(req, res)
});

app.post('/', (req, res) => {
    const { name, password } = req.body;
    const sql = "SELECT * FROM usuarios WHERE accountNum = ?";
    db.query(sql, [name], (err, result) => {
        if(err) {
            renderIndex(req, res, 'Senha ou usuário incorretos')
        } else {
            const user = result[0];
            if(user <= 0) {
                renderIndex(req, res, 'Senha ou usuário incorretos')
            } else {
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) {
                        renderIndex(req, res, 'Senha ou usuário incorretos')
                    } else if (result) {
                        req.session.accountNum = user.accountNum;
                        const sqlAllAccounts = "SELECT * FROM usuarios WHERE accountNum != ?"; // obter todas as contas menos a sua própria
                        db.query(sqlAllAccounts, [user.accountNum], (err, accounts) => {
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
                                        res.render('login', {nome: user.nome, saldo: user.balance, accountNum: user.accountNum, contas: accounts, extrato: extract, error: ''});
                                    }
                                });
                            }
                        });
                    } else {
                        renderIndex(req, res, 'Usuário ou senha incorreto')
                    }
                })
            }
        }
    });
});

// Rota para criar uma conta
app.post('/createAccount', (req, res) => {
    const { name, accountNum, balance, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.log(err);
            res.status(500).send('Erro ao criar a conta');
        } else {
            const sql = "INSERT INTO usuarios (nome, accountNum, balance, password) VALUES (?, ?, ?, ?)";
            db.query(sql, [name, accountNum, balance, hash], function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(500).send('Erro ao criar a conta');
                } else {
                    req.session.accountNum = accountNum;
                    const sqlAllAccounts = "SELECT * FROM usuarios WHERE accountNum != ?"; // obter todas as contas
                    db.query(sqlAllAccounts, [accountNum], (err, accounts) => {
                        if(err) {
                            console.log(err);
                            res.status(500).send('Erro ao buscar contas');
                        } else {
                            res.render('login', {nome: name, saldo: balance, accountNum: accountNum, contas: accounts, extrato: [], error: ''});
                        }
                    });
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
    const val = parseFloat(req.body.val);
    const accountNum = req.body.accountNum;
    const source = req.session.accountNum;

    if (isNaN(val) || !accountNum || !source) {
        console.log('Dados de entrada inválidos');
        return renderLogin(req, res, 'Dados de entrada inválidos');
    }

    if(accountNum == source) {
        console.log('Você não pode transferir para sua conta conta');
        return renderLogin(req, res, 'Você não pode transferir para sua conta');
    }

    db.beginTransaction(function(err) {
        if (err) { throw err; }

        const sql = 'SELECT * FROM usuarios WHERE accountNum = ?';
        db.query(sql, [source], function (err, results) {
            if (err) {
                return db.rollback(function() {
                    throw err;
                });
            }

            const sourceBalance = parseFloat(results[0].balance);
            if (isNaN(sourceBalance) || sourceBalance < val) {
                console.log('Saldo insuficiente');
                return renderLogin(req, res, 'Saldo insuficiente para transferir');
            }

            const newSource = sourceBalance - val;
            const sqlUpdateSource = 'UPDATE usuarios SET balance = ? WHERE accountNum = ?';
            db.query(sqlUpdateSource, [newSource, source], function (err, results) {
                if (err) {
                    return db.rollback(function() {
                        throw err;
                    });
                }

                db.query(sql, [accountNum], function (err, results) {
                    if (err) {
                        return db.rollback(function() {
                            throw err;
                        });
                    }

                    const targetBalance = parseFloat(results[0].balance);
                    const newTarget = targetBalance + val;
                    const sqlUpdateTarget = 'UPDATE usuarios SET balance = ? WHERE accountNum = ?';
                    db.query(sqlUpdateTarget, [newTarget, accountNum], function (err, results) {
                        if (err) {
                            return db.rollback(function() {
                                throw err;
                            });
                        }

                        const sqlInsertTransaction = 'INSERT INTO transacoes (valor, accountNum, tipo) VALUES (?,?,?)';
                        db.query(sqlInsertTransaction, [val, accountNum, 'Recebimento (+)'], function (err, results) {
                            if(err) {
                                return db.rollback(function() {
                                    throw err;
                                });
                            }

                            db.query(sqlInsertTransaction, [val, source, 'Transferência (-)'], function (err, results) {
                                if(err) {
                                    return db.rollback(function() {
                                        throw err;
                                    });
                                }

                                db.commit(function(err) {
                                    if (err) {
                                        return db.rollback(function() {
                                            throw err;
                                        });
                                    }
                                    console.log('Transferência concluída com sucesso!');
                                    res.redirect('/login');
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});



app.post('/deposit', (req, res) => {
    const val = parseFloat(req.body.val); // Convert the deposit value to a number
    const accountNum = req.session.accountNum;
    const sql = 'SELECT * FROM usuarios WHERE accountNum = ?';
    db.query(sql, [accountNum], (err, results) => {
        if (err) {
            console.log(err)
        } else {
            const user = results[0];
            const newBalance = val + user.balance
            const sqlUpdate = 'UPDATE usuarios SET balance = ? WHERE accountNum = ?';
            db.query(sqlUpdate, [newBalance, accountNum], (err, results) => {
                if (err) {
                    console.log(err)
                } else {
                    const sqlInsertTransaction = 'INSERT INTO transacoes (valor, accountNum, tipo) VALUES (?,?,?)';
                    db.query(sqlInsertTransaction, [val, accountNum, 'Depósito (+)'], (err, results) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.redirect('/login');
                        }
                    })
                }
            })
        }
    })
})

app.post('/withdraw', (req, res) => {
    const val = parseFloat(req.body.val); // Convert the deposit value to a number
    const accountNum = req.session.accountNum;
    const sql = 'SELECT * FROM usuarios WHERE accountNum = ?';
    db.query(sql, [accountNum], (err, results) => {
        if (err) {
            console.log(err)
        } else {
            const user = results[0];
            if (user.balance < val) {
                console.log('Saldo insuficiente')
                renderLogin(req, res, 'Saldo insuficiente para saque')
            } else {
                const newBalance = user.balance - val;
                const sqlUpdate = 'UPDATE usuarios SET balance = ? WHERE accountNum = ?';
                db.query(sqlUpdate, [newBalance, accountNum], (err, results) => {
                    if (err) {
                        console.log(err)
                    } else {
                        const sqlInsertTransaction = 'INSERT INTO transacoes (valor, accountNum, tipo) VALUES (?,?,?)';
                        db.query(sqlInsertTransaction, [val, accountNum, 'Saque (-)'], (err, results) => {
                            if (err) {
                                console.log(err)
                            } else {
                                res.redirect('/login');
                            }
                        })
                    }
                })
            }
        }
    })
})