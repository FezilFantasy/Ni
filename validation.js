//КЛЮЧИ ДЛЯ ХРАНЕНИЯ В LOCALSTORAGE
const USERS_KEY = 'russian_ochag_users';           // Ключ для хранения всех пользователей
const CURRENT_USER_KEY = 'russian_ochag_current_user';  // Ключ для хранения текущего авторизованного пользователя

// ИНИЦИАЛИЗАЦИЯ: СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ ПО УМОЛЧАНИЮ
function initUsers() {
    // Проверяем, есть ли в localStorage список пользователей
    if (!localStorage.getItem(USERS_KEY)) {
        // Если нет - создаём пользователя по умолчанию (для тестирования)
        const defaultUsers = [
            {
                id: '1',                          // Уникальный ID
                fullName: 'Федор',                // Полное имя
                email: 'fedor@mail.ru',           // Email для входа
                password: '123456',               // Пароль (в реальном проекте хэшируют!)
                phone: '+79513695544',            // Номер телефона
                completedRecipes: 4,              // Количество пройденных рецептов
                favoriteRecipes: 4,               // Количество рецептов в избранном
                createdAt: new Date().toISOString()  // Дата регистрации
            }
        ];
        // Сохраняем в localStorage (превращаем объект в JSON строку)
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
}

// ПОЛУЧЕНИЕ СПИСКА ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
function getUsers() {
    // Достаём из localStorage, парсим JSON, если пусто - возвращаем пустой массив
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

// СОХРАНЕНИЕ СПИСКА ПОЛЬЗОВАТЕЛЕЙ 
function saveUsers(users) {
    // Превращаем массив пользователей в JSON строку и сохраняем
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ПОЛУЧЕНИЕ ТЕКУЩЕГО АВТОРИЗОВАННОГО ПОЛЬЗОВАТЕЛЯ
function getCurrentUser() {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);  // Достаём строку
    return userStr ? JSON.parse(userStr) : null;             // Парсим или возвращаем null
}

// УСТАНОВКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (ВХОД)
function setCurrentUser(user) {
    if (user) {
        // Создаём копию пользователя, удаляем пароль (безопасность!)
        const userCopy = { ...user };
        delete userCopy.password;  // Не храним пароль в "текущем" пользователе
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userCopy));
    } else {
        // Выход: удаляем ключ
        localStorage.removeItem(CURRENT_USER_KEY);
    }
}

// ВАЛИДАЦИЯ EMAIL (ПРОВЕРКА КОРРЕКТНОСТИ)
function validateEmail(email) {
    // Регулярное выражение для проверки email адреса
    const re = /^(([^<>()[\]\.,;:\s@"]+(\.[^<>()[\]\.,;:\s@"]+)*)|(".+"))@(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());  // Возвращает true если email валидный
}

// РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
function registerUser(fullName, email, password, confirmPassword, conditions) {
    // 1. Проверка на заполнение всех полей
    if (!fullName || !email || !password || !confirmPassword) {
        return { success: false, message: 'Заполните все поля!' };
    }
    
    // 2. Проверка корректности email
    if (!validateEmail(email)) {
        return { success: false, message: 'Некорректный email!' };
    }
    
    // 3. Проверка длины пароля (минимум 6 символов)
    if (password.length < 6) {
        return { success: false, message: 'Пароль должен содержать не менее 6 символов!' };
    }
    
    // 4. Проверка совпадения пароля и подтверждения
    if (password !== confirmPassword) {
        return { success: false, message: 'Пароли не совпадают!' };
    }
    
    // 5. Проверка согласия с условиями
    if (!conditions) {
        return { success: false, message: 'Подтвердите согласие с условиями использования!' };
    }
    
    // 6. Проверка - не занят ли email
    const users = getUsers();
    if (users.some(u => u.email === email)) {
        return { success: false, message: 'Пользователь с таким email уже существует!' };
    }
    
    // 7. Создаём нового пользователя
    const newUser = {
        id: Date.now().toString(),           // ID = текущая метка времени в мс
        fullName: fullName,
        email: email,
        password: password,                  // В реальном проекте пароль хэшируют!
        phone: '',                           // Телефон пока не указан
        completedRecipes: 0,                // 0 пройденных рецептов
        favoriteRecipes: 0,                 // 0 рецептов в избранном
        createdAt: new Date().toISOString() // Дата регистрации
    };
    
    // 8. Сохраняем пользователя
    users.push(newUser);
    saveUsers(users);
    
    return { success: true, message: 'Регистрация прошла успешно!' };
}

// ВХОД ПОЛЬЗОВАТЕЛЯ
function loginUser(email, password, rememberMe) {
    // Проверка на заполнение полей
    if (!email || !password) {
        return { success: false, message: 'Заполните все поля!' };
    }
    
    // Проверка корректности email
    if (!validateEmail(email)) {
        return { success: false, message: 'Некорректный email!' };
    }
    
    // Ищем пользователя с таким email и паролем
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Успешный вход: сохраняем текущего пользователя
        setCurrentUser(user);
        
        // Если чекбокс "Запомнить меня" отмечен - сохраняем email
        if (rememberMe) {
            localStorage.setItem('remembered_email', email);
        } else {
            localStorage.removeItem('remembered_email');
        }
        
        return { success: true, message: 'Вход выполнен успешно!' };
    }
    
    // Неправильный email или пароль
    return { success: false, message: 'Неверный email или пароль!' };
}

// ВЫХОД ПОЛЬЗОВАТЕЛЯ
function logoutUser() {
    // Просто удаляем ключ с текущим пользователем
    localStorage.removeItem(CURRENT_USER_KEY);
}

// ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ (УНИВЕРСАЛЬНАЯ ФУНКЦИЯ)
function updateUserProfile(updatedData) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        // Объединяем старые данные с новыми (поверхностное слияние)
        users[userIndex] = { ...users[userIndex], ...updatedData };
        saveUsers(users);              // Сохраняем обновлённый список
        setCurrentUser(users[userIndex]);  // Обновляем текущего пользователя
        return true;
    }
    return false;
}

// СМЕНА ПАРОЛЯ
function updateUserPassword(newPassword) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    // Валидация нового пароля
    if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'Пароль должен содержать не менее 6 символов!' };
    }
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;  // Обновляем пароль
        saveUsers(users);
        return { success: true, message: 'Пароль успешно изменён!' };
    }
    return { success: false, message: 'Ошибка при смене пароля!' };
}

// ОБНОВЛЕНИЕ НОМЕРА ТЕЛЕФОНА 
function updateUserPhone(phone) {
    // Используем универсальную функцию updateUserProfile
    return updateUserProfile({ phone: phone });
}

// ОБНОВЛЕНИЕ СЧЁТЧИКА ИЗБРАННОГО
function updateFavoriteCount() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Достаём избранное из localStorage
        const favorites = localStorage.getItem(`favorites_${currentUser.id}`);
        const favoritesCount = favorites ? JSON.parse(favorites).length : 0;
        // Обновляем количество в профиле (опечатка: favoritesRecipes вместо favoriteRecipes)
        updateUserProfile({ favoritesRecipes: favoritesCount });
    }
}

// ОТМЕТКА РЕЦЕПТА КАК ПРОЙДЕННОГО
function markRecipeAsCompleted(recipeId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    // Достаём список пройденных рецептов из localStorage
    let completed = localStorage.getItem(`completed_${currentUser.id}`);
    let completedList = completed ? JSON.parse(completed) : [];
    
    // Если рецепт ещё не отмечен
    if (!completedList.includes(recipeId)) {
        completedList.push(recipeId);  // Добавляем ID
        localStorage.setItem(`completed_${currentUser.id}`, JSON.stringify(completedList));
        updateUserProfile({ completedRecipes: completedList.length });  // Обновляем счётчик
        return true;
    }
    return false;  // Рецепт уже был отмечен
}

// ПРОВЕРКА: ОТМЕЧЕН ЛИ РЕЦЕПТ КАК ПРОЙДЕННЫЙ
function isRecipeCompleted(recipeId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    const completed = localStorage.getItem(`completed_${currentUser.id}`);
    const completedList = completed ? JSON.parse(completed) : [];
    return completedList.includes(recipeId);  // true если рецепт в списке
}

// Запуск
initUsers();  