document.addEventListener('DOMContentLoaded', function () {
    // Проверяем, не находимся ли уже на странице /auth
    if (window.location.pathname === '/auth') {
        // Если на /auth, не делаем проверку JWT, просто ждём входа
        setupLoginForm();
    } else {
        // Проверка JWT для других страниц
        fetch('/auth/check-jwt', {
            method: 'GET',
            credentials: 'include'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('JWT invalid');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.valid) {
                    // Если токен валиден, идём на главную
                    window.location.href = '/';
                } else {
                    // Если не валиден, идём на /auth
                    window.location.href = '/auth';
                }
            })
            .catch(error => {
                console.error('Error checking JWT:', error);
                window.location.href = '/auth';
            });
    }

    function setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const login = document.getElementById('login').value;
                const password = document.getElementById('password').value;

                fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ login: login, password: password }),
                    credentials: 'include'
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Login failed');
                        }
                        // Не пытаемся разобрать JSON, просто полагаемся на куку
                        window.location.href = '/'; // Переход на главную после успешного входа
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert(error.message || 'Login failed. Please check your credentials.');
                    });
            });
        }
    }
});
