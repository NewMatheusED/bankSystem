class Conta {
    constructor(name, account_num, balance, password) {
        if (typeof name !== 'string') {
            throw new Error('Name must be a string');
        }

        if (typeof account_num !== 'number') {
            throw new Error('Account number must be a number');
        }

        if (typeof balance !== 'number') { 
            throw new Error('Balance must be a number');
        }

        if (typeof password !== 'string') {
            throw new Error('Password must be a string');
        }

        this.name = name;
        this.account_num = account_num;
        this.balance = balance;
        this.password = password;
        this.extract = [];
    }

    _deposit(amount) {
        if(amount > 0) {
            this.balance += amount;
            console.log(`Deposited: ${amount}`);
            console.log(`Currency balance: ${this.balance}`);
            this.extract.push({'Deposited: ' : amount});
        } else {
            console.log("Invalid amount")
        }
    }

    _withdraw(amount) {
        if(amount <= this.balance && amount > 0) {
            this.balance -= amount;
            console.log(`Withdraw: ${amount}`);
            console.log(`Currency balance: ${this.balance}`);
            this.extract.push({'Withdraw: ' : amount});
        } else {
            console.log(`Insufficient funds, you only have ${this.balance}`)
        }
    }

    _transfer(amount, account_num, sistema) {
        if (sistema._verifyAccount(account_num)) {
            let accountTo = sistema.accounts.find(acc => acc.account_num === account_num);
            if (amount > 0 && amount <= this.balance) {
                this.balance -= amount;
                accountTo.balance += amount;
                console.log(`Transfered: ${amount} to ${accountTo.name}`);
                this.extract.push({'Transfered': amount, 'To': accountTo.name});
            } else {
                console.log('Insufficient funds');
            }
        } else {
            console.log('Invalid account');

        }
    }

    _getBalance() {
        console.log(`Balance of ${this.name}: ${this.balance}`);
    }

    _getExtract() {
        console.log(this.extract)
    }
}

module.exports = Conta;