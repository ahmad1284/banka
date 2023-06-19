let state = Object.freeze({
    account: null
});

const storageKey = 'savedAccount';

const routes = {
    '/login': {templateId: 'login', title: 'Login | Bank App'},
    '/dashboard': {templateId: 'dashboard', init: refresh, title: 'Dashboard | Bank App'},
    '/credz': {templateId: 'credz'}
};

function updateRoute() {
    const path = window.location.pathname;
    const route = routes[path];

    // if no route specified
    if (!route){
        return navigate('/dashboard');
    }

    const template = document.getElementById(route.templateId);
    const view = template.content.cloneNode(true);
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(view);

    document.title = route.title;

    console.log(`${route.templateId} is shown`);

    if (typeof route.init === 'function'){
        route.init();
    }
}

 

// reload path without reloading
 function navigate(path) {
    window.history.pushState({}, path, path);
    updateRoute();
 }

 function onLinkClick(event) {
    event.preventDefault();
    navigate(event.target.href);
 }

async function register() {
    const registerForm = document.getElementById('registerForm');
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData);
    const jsonData = JSON.stringify(data);
    const result = await createAccount(jsonData);

    if (result.error) {
        return console.log('An error occurred:', result.error);
      }
    
    console.log('Account created!', result);

    updateState('account', result);
    navigate('/dashboard')
}

async function createAccount(account) {
    try {
        const response = await fetch('//localhost:5000/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type' : 'application/json'},
            body: account
        });
        return await response.json();
    } catch (error) {
        return { error: error.message || 'Unknown error'};
    }
}

async function login() {
    const loginForm = document.getElementById('loginForm')
    const user = loginForm.user.value;
    const data = await getAccount(user);
  
    if (data.error) {
      return updateElement('loginError', data.error);
    }
  
    updateState('account', data);
    navigate('/dashboard');
  }

function logout() {
    updateState('account', null);
    navigate('/login');
}

async function getAccount(user) {
    try {
        const response = await fetch('//localhost:5000/api/accounts/' + encodeURIComponent(user));
        return await response.json();
    } catch (error) {
        return { error: error.message || 'Unknown error'};
    }
}

function createTransactionRow(transaction) {
    const template = document.getElementById('transaction');
    const transactionRow = template.content.cloneNode(true);
    const tr = transactionRow.querySelector('tr');

    tr.children[0].textContent = transaction.date;
    tr.children[1].textContent = transaction.object;
    tr.children[2].textContent = transaction.amount.toFixed(2);

    return transactionRow;
}

function updateElement(id, textOrNode){
    const element = document.getElementById(id);
    element.textContent = '';
    element.append(textOrNode);
}

function updateDashboard() {
    const account = state.account;
    if (!account) {
        return navigate('/login');
    }

    updateElement('description', account.description);
    updateElement('balance', account.balance.toFixed(2));
    updateElement('currency', account.currency);

    const transactionRows = document.createDocumentFragment();
    for (const transaction of account.transactions) {
        const transactionRow = createTransactionRow(transaction);
        transactionRows.appendChild(transactionRow);
    }
    updateElement('transactions', transactionRows);

}

function updateState(property, newData){
    state = Object.freeze({
        ...state,
        [property]: newData
    });
    // console.log("State: \\>")
    // console.log(state);

    localStorage.setItem(storageKey, JSON.stringify(state.account));
}


async function updateAccountData() {
    const account =state.account;
    if (!account) {
        return logout();
    }

    const data = await getAccount(account.user);
    if (data.error) {
        return logout();
    }

    updateState('account', data);
}

async function refresh(){
    await updateAccountData();
    updateDashboard();
}

function init() {
    const savedAccount = localStorage.getItem(storageKey);
    if (savedAccount) {
        updateState('account', JSON.parse(savedAccount));
    }

    window.onpopstate = () => updateRoute();
    updateRoute();

}

init();