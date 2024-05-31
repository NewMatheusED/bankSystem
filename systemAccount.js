const Conta = require('./Conta');
const con = require('./db');
class systemAccount {

    constructor() {
        this.accounts = [];
    }

    _addAccount(account) {
        var sql = "INSERT INTO usuarios (nome, accountNum, balance, password) VALUES (?, ?, ?, ?)";
        return new Promise((resolve, reject) => {
            con.query(sql, [account.name, account.account_num, account.balance, account.password], function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Account of ${account.name} added in the system`);
                    resolve(result);
                }
            });
        });
    }

    _createAccount(name, accountNum, balance, password) {
        let newAccount = new Conta(name, accountNum, balance, password);
        this._addAccount(newAccount);
    }

    _verifyAccount(account_num) {
        var sql = "SELECT * FROM usuarios WHERE accountNum = ?";
        return new Promise((resolve, reject) => {
            con.query(sql, [account_num], function (err, results) {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });
    }
    
    _getAccount(numAccount) {
        var sql = "SELECT * FROM usuarios WHERE accountNum = ?";
        return new Promise((resolve, reject) => {
            con.query(sql, [numAccount], function (err, results) {
                if (err) reject(err);
                resolve(results[0]);
            });
        });
    }

    _login(user, pass) {
        var sql = "SELECT * FROM usuarios WHERE accountNum = ? AND password = ?";
        return new Promise((resolve, reject) => {
            con.query(sql, [user, pass], function (err, results) {
                if (err) reject(err);
                resolve(results[0])
            })
        });
    }
}

module.exports = systemAccount;