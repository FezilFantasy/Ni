// ПОЛЬЗОВАТЕЛИ
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        return JSON.parse(userJson);
    }
    return null;
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// РЕГИСТРАЦИЯ
async function registerUser(fullName, email, password, confirmPassword, conditions) {
    if (password !== confirmPassword) {
        return { success: false, message: 'Пароли не совпадают' };
    }
    if (!conditions) {
        return { success: false, message: 'Примите условия использования' };
    }
    if (password.length < 6) {
        return { success: false, message: 'Пароль должен быть минимум 6 символов' };
    }
    
    const users = getUsers();
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Пользователь с таким email уже существует' };
    }
    
    const newUser = {
        id: Date.now(),
        fullName,
        email,
        password,
        phone: '',
        favorites: [],
        completed: []
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return { success: true, message: 'Регистрация успешна' };
}

// ВХОД
async function loginUser(email, password, rememberMe) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return { success: false, message: 'Неверный email или пароль' };
    }
    
    setCurrentUser(user);
    
    if (rememberMe) {
        localStorage.setItem('remembered_email', email);
    } else {
        localStorage.removeItem('remembered_email');
    }
    
    return { success: true, message: 'Вход выполнен', user: user };
}

// ВЫХОД
function logoutUser() {
    localStorage.removeItem('currentUser');
}

// ОБНОВЛЕНИЕ ПРОФИЛЯ
async function updateUserPhone(phone) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'Не авторизован' };
    
    const users = getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) return { success: false, message: 'Пользователь не найден' };
    
    users[index].phone = phone;
    saveUsers(users);
    setCurrentUser(users[index]);
    
    return { success: true, message: 'Телефон обновлён', user: users[index] };
}

async function updateUserPassword(password) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'Не авторизован' };
    if (password.length < 6) {
        return { success: false, message: 'Пароль должен быть минимум 6 символов' };
    }
    
    const users = getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) return { success: false, message: 'Пользователь не найден' };
    
    users[index].password = password;
    saveUsers(users);
    
    return { success: true, message: 'Пароль изменён' };
}

// ИЗБРАННОЕ
async function getFavorites() {
    const user = getCurrentUser();
    if (!user) return [];
    return user.favorites || [];
}

async function addToFavorites(recipeId) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const users = getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) return false;
    
    if (!users[index].favorites) users[index].favorites = [];
    if (!users[index].favorites.includes(recipeId)) {
        users[index].favorites.push(recipeId);
    }
    
    saveUsers(users);
    setCurrentUser(users[index]);
    return true;
}

async function removeFromFavorites(recipeId) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const users = getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) return false;
    
    users[index].favorites = (users[index].favorites || []).filter(id => id !== recipeId);
    saveUsers(users);
    setCurrentUser(users[index]);
    return true;
}

// ПРОЙДЕННЫЕ РЕЦЕПТЫ
async function getCompletedRecipes() {
    const user = getCurrentUser();
    if (!user) return [];
    return user.completed || [];
}

async function markRecipeAsCompleted(recipeId) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const users = getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) return false;
    
    if (!users[index].completed) users[index].completed = [];
    if (!users[index].completed.includes(recipeId)) {
        users[index].completed.push(recipeId);
    } else {
        return false;
    }
    
    saveUsers(users);
    setCurrentUser(users[index]);
    return true;
}

// ПРОВЕРКА
function isFavoriteSync(recipeId) {
    const user = getCurrentUser();
    if (!user) return false;
    return (user.favorites || []).includes(recipeId);
}

async function isRecipeCompleted(recipeId) {
    const completed = await getCompletedRecipes();
    return completed.includes(recipeId);
}

// ПОДПИСКА
function saveSubscription(email) {
    if (!email || !validateEmail(email)) return false;
    let subscriptions = localStorage.getItem('subscriptions');
    let subsList = subscriptions ? JSON.parse(subscriptions) : [];
    if (!subsList.includes(email)) {
        subsList.push(email);
        localStorage.setItem('subscriptions', JSON.stringify(subsList));
        return true;
    }
    return false;
}

function showMessage(text, isError = false) {
    let toast = document.getElementById('messageToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'messageToast';
        toast.className = 'message-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.background = isError ? '#C6440E' : '#2C7A3E';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function validatePhone(phone) {
    const re = /^[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]$/;
    return re.test(phone);
}

function validateName(name) {
    const re = /^[A-Za-zА-Яа-яЁё\s]{2,50}$/;
    return re.test(name);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function updateNavLink() {
    const authLink = document.getElementById('authLink');
    const currentUser = getCurrentUser();
    if (authLink) {
        if (currentUser) {
            authLink.textContent = 'Профиль';
            authLink.href = 'profile.html';
        } else {
            authLink.textContent = 'Вход';
            authLink.href = 'login.html';
        }
    }
}

function initSubscriptionForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        if (input && input.value && validateEmail(input.value)) {
            if (saveSubscription(input.value)) {
                showMessage(`Спасибо за подписку, ${input.value}!`);
                input.value = '';
            } else {
                showMessage('Вы уже подписаны на рассылку!', false);
            }
        } else {
            showMessage('Введите корректный email', true);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavLink();
    initSubscriptionForm('subscribeForm');
    initSubscriptionForm('subscrideForm');
});