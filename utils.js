const API_URL = 'http://localhost:3000/api';
let currentUser = null;

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

function getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        currentUser = JSON.parse(userJson);
        return currentUser;
    }
    return null;
}

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
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
    }
}

async function loginUser(email, password, rememberMe) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            currentUser = result.user;
            
            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
            } else {
                localStorage.removeItem('remembered_email');
            }
        }
        
        return result;
    } catch (error) {
        console.error('Ошибка входа:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
    }
}

function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    currentUser = null;
}

async function updateUserPhone(phone) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'Не авторизован' };
    
    try {
        const response = await fetch(`${API_URL}/user/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            currentUser = result.user;
        }
        return result;
    } catch (error) {
        console.error('Ошибка обновления:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
    }
}

async function updateUserPassword(password) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'Не авторизован' };
    
    if (password.length < 6) {
        return { success: false, message: 'Пароль должен быть минимум 6 символов' };
    }
    
    try {
        const response = await fetch(`${API_URL}/user/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
    }
}

async function getFavorites() {
    const user = getCurrentUser();
    if (!user) return [];
    
    try {
        const response = await fetch(`${API_URL}/favorites/${user.id}`);
        const data = await response.json();
        return data.favorites;
    } catch (error) {
        console.error('Ошибка получения избранного:', error);
        return [];
    }
}

async function addToFavorites(recipeId) {
    const user = getCurrentUser();
    if (!user) return false;
    
    try {
        const response = await fetch(`${API_URL}/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, recipeId })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Ошибка добавления в избранное:', error);
        return false;
    }
}

async function removeFromFavorites(recipeId) {
    const user = getCurrentUser();
    if (!user) return false;
    
    try {
        const response = await fetch(`${API_URL}/favorites`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, recipeId })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Ошибка удаления из избранного:', error);
        return false;
    }
}

function isFavoriteSync(recipeId, favoritesList) {
    return favoritesList.includes(recipeId);
}

async function markRecipeAsCompleted(recipeId) {
    const user = getCurrentUser();
    if (!user) return false;
    
    try {
        const response = await fetch(`${API_URL}/completed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, recipeId })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Ошибка отметки рецепта:', error);
        return false;
    }
}

async function getCompletedRecipes() {
    const user = getCurrentUser();
    if (!user) return [];
    
    try {
        const response = await fetch(`${API_URL}/completed/${user.id}`);
        const data = await response.json();
        return data.completed;
    } catch (error) {
        console.error('Ошибка получения пройденных рецептов:', error);
        return [];
    }
}

async function isRecipeCompleted(recipeId) {
    const completed = await getCompletedRecipes();
    return completed.includes(recipeId);
}

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

function getSubscribersCount() {
    let subscriptions = localStorage.getItem('subscriptions');
    return subscriptions ? JSON.parse(subscriptions).length : 0;
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

function addBreadcrumbs() {
    const main = document.querySelector('main');
    if (!main || document.querySelector('.breadcrumbs')) return;
    
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '');
    const pageNames = {
        'index': 'Главная',
        'catalog': 'Каталог рецептов',
        'recipe': 'Рецепт',
        'history': 'Истории рецептов',
        'favorites': 'Избранное',
        'profile': 'Профиль',
        'login': 'Вход',
        'register': 'Регистрация',
        'tests': 'Тест по продуктам'
    };
    
    const breadcrumbs = document.createElement('div');
    breadcrumbs.className = 'breadcrumbs';
    breadcrumbs.innerHTML = `
        <a href="index.html">Главная</a>
        <span>›</span>
        <span>${pageNames[page] || page}</span>
    `;
    
    if (main.firstChild) {
        main.insertBefore(breadcrumbs, main.firstChild);
    } else {
        main.appendChild(breadcrumbs);
    }
}

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavLink();
    addBreadcrumbs();
    initSubscriptionForm('subscribeForm');
    initSubscriptionForm('subscrideForm');
});