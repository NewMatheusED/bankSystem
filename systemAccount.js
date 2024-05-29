var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "usuarios"
});

class systemAccount {
    constructor() {
        this.accounts = [];
    }

    _addAccount(account) {
        var sql = "INSERT INTO accounts (name, account_num, balance, password) VALUES (?, ?, ?, ?)";
        con.query(sql, [account.name, account.account_num, account.balance, account.password], function (err, result) {
            if (err) throw err;
            console.log(`Account of ${account.name} added in the system`);
        });
    }

    _createAccount(name, accountNum, balance, password) {
        let newAccount = new Conta(name, accountNum, balance, password);
        this._addAccount(newAccount);
    }

    _verifyAccount(account_num) {
        var sql = "SELECT * FROM accounts WHERE account_num = ?";
        con.query(sql, [account_num], function (err, results) {
            if (err) throw err;
            return results.length > 0;
        });
    }

    _getAccount(numAccount) {
        var sql = "SELECT * FROM accounts WHERE account_num = ?";
        con.query(sql, [numAccount], function (err, results) {
            if (err) throw err;
            return results[0];
        });
    }

    _login(user, pass) {
        var sql = "SELECT * FROM accounts WHERE account_num = ? AND password = ?";
        con.query(sql, [user, pass], function (err, results) {
            if (err) throw err;
            return results.length > 0;
        });
    }
}

module.exports = systemAccount;