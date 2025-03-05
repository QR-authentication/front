document.addEventListener('DOMContentLoaded', function () {
    // Управление вкладками
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            // Убираем активный класс у всех вкладок и контента
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Добавляем активный класс текущей вкладке и контенту
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Плавная анимация появления контента
            gsap.fromTo(`#${tabId}`,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            );
        });
    });

    // Проверка куки
    fetch('/auth/check-jwt', {
        method: 'GET',
        credentials: 'include'
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
            method: 'GET', // Предполагается, что сервер ожидает GET (см. предыдущие обсуждения)
            credentials: 'include'
        })
            .then(response => {
                if (response.ok) {
                    // Очищаем куку на клиентской стороне
                    document.cookie = 'FA_AUTH_TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
