class systemAccount {
    constructor() {
        this.accounts = [];
    }

    _addAccount(account) {
        if(this.accounts.length > 0) {
            for (let acc of this.accounts) {
                if(acc.account_num == account.account_num) {
                    console.log("Account already exists");
                    return false;
                }else{
                    this.accounts.push(account);
                    console.log(`Account of ${account.name} added in the system`)
                    return true;
                }
            }
        } else {
            this.accounts.push(account);
            console.log(`Account of ${account.name} added in the system`)
            return true;
        }
    }

    _verifyAccount(account) { //input valid only with string values
        let account_num;
        if (account instanceof Conta) {
            account_num = account.account_num;
        } else {
            account_num = account;
        }
    
        for (let acc of this.accounts) {
            if (acc.account_num === account_num) {
                //console.log(`Account of ${acc.name}`);
                return true;
            }
        }
        console.log('Account doesnt exist');
        return false;
    }

    _getAccount(numAccount) {
        return this.accounts.find(acc => acc.account_num === numAccount);
    }

    _getAllAccounts() {
        console.log(this.accounts);
    }
    
    _login(user, pass) {
        for (let acc of this.accounts) {
            if(acc.account_num === user) {
                if(acc.password === pass) {
                    console.log(`Bem-vindo ${acc.name}`);
                    return true;
                }
            }
        }
        console.log('Tente novamente');
        return false;
    }
    
}
class Conta {
    constructor(name, account_num, balance, password) {
        if (typeof name !== 'string') {
            throw new Error('Name must be a string');
        }

        if (typeof account_num !== 'string') {
            throw new Error('Account number must be a string');
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

// let sistema = new systemAccount();
// let conta1 = new Conta("Matheus", "123456", 1000);
// let conta2 = new Conta("Lucas", "654321", 500);
// sistema._addAccount(conta1);
// sistema._addAccount(conta2);
// conta1._deposit(200);
// conta1._deposit(500);
// conta1._withdraw(1000);
// conta1._transfer(500, "654321", sistema);
// conta1._getExtract();
//let conta = new Conta(123, "123456", "1000"); error example
