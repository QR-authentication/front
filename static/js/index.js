document.addEventListener('DOMContentLoaded', function () {
    // Проверка куки
    fetch('/auth/check-jwt', {
        method: 'GET',
        credentials: 'include' // Убедимся, что куки отправляются с запросом
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('JWT check failed');
            }
            return response.json();
        })
        .then(data => {
            if (!data.valid) {
                window.location.href = '/auth';
            }
        })
        .catch(error => {
            console.error('Error checking JWT:', error);
            window.location.href = '/auth';
        });

    // Обработка кнопки выхода
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', function () {
        fetch('/auth/logout', {
            method: 'GET',
            credentials: 'include' // Убедимся, что куки отправляются и затираются
        })
            .then(response => {
                if (response.ok) {
                    // Очищаем куку на клиентской стороне (если сервер её удалил)
                    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    window.location.href = '/auth'; // Переход на страницу входа
                } else {
                    throw new Error('Logout failed');
                }
            })
            .catch(error => {
                console.error('Error logging out:', error);
                alert('Logout failed. Please try again.');
            });
    });
});
