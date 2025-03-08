document.addEventListener('DOMContentLoaded', function () {
    // Управление вкладками
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const testingTab = document.querySelector('.nav-tab[data-tab="testing"]');
    const testingContent = document.getElementById('testing');
    const testingDescription = document.getElementById('testing-description');
    const authContainer = document.getElementById('auth-container');
    const qrActions = document.getElementById('qr-actions');
    const logoutBtn = document.getElementById('logout-btn');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const qrScanContainer = document.getElementById('qr-scan-container');
    let scanning = false;
    let videoStream = null;
    let loginFormHandlerSet = false; // Флаг для отслеживания обработчика

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

            // Если переходим из Testing в Description, скрываем QR-код и сканер
            if (tabId !== 'testing') {
                hideQrElements();
            }

            // Если выбрана вкладка Testing, проверяем авторизацию
            if (tabId === 'testing') {
                checkAuthStatus();
            }
        });
    });

    // Проверка авторизации при загрузке, если открыта вкладка Testing
    if (testingTab.classList.contains('active')) {
        checkAuthStatus();
    }

    // Функция проверки статуса авторизации
    function checkAuthStatus() {
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
                if (data.valid) {
                    showTestingFeatures();
                } else {
                    showLoginForm();
                }
            })
            .catch(error => {
                console.error('Error checking JWT:', error);
                showLoginForm();
            });
    }

    // Показать форму логина (неавторизован)
    function showLoginForm() {
        testingDescription.style.display = 'none';
        authContainer.style.display = 'flex';
        qrActions.style.display = 'none';
        logoutBtn.style.display = 'none';
        hideQrElements();
        setupLoginForm();
    }

    // Показать функционал тестирования (авторизован)
    function showTestingFeatures() {
        testingDescription.style.display = 'block';
        authContainer.style.display = 'none';
        qrActions.style.display = 'block';
        logoutBtn.style.display = 'block';
    }

    // Скрыть QR-код и сканер
    function hideQrElements() {
        qrCodeContainer.style.display = 'none';
        qrScanContainer.style.display = 'none';
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
            scanning = false;
        }
    }

    // Показать кастомное сообщение об ошибке
    function showCustomError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        // Удаляем сообщение через 3 секунды с анимацией
        gsap.to(errorDiv, {
            opacity: 0,
            duration: 0.5,
            delay: 2.5,
            ease: 'power2.out',
            onComplete: () => errorDiv.remove()
        });
    }

    // Настройка формы логина
    function setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        const loginInput = document.getElementById('login');
        const passwordInput = document.getElementById('password');

        if (loginForm && !loginFormHandlerSet) {
            loginForm.addEventListener('submit', function (e) {
                e.preventDefault();

                const login = loginInput.value.trim();
                const password = passwordInput.value.trim();

                // Проверка на пустые поля
                if (!login || !password) {
                    showCustomError('Please fill in both login and password fields.');
                    return;
                }

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
                        loginInput.value = '';
                        passwordInput.value = '';
                        showTestingFeatures();
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        loginInput.value = '';
                        passwordInput.value = '';
                        showCustomError('Login failed. Please check your credentials.');
                    });
            });
            loginFormHandlerSet = true;
        }
    }

    // Обработка кнопки выхода
    logoutBtn.addEventListener('click', function () {
        fetch('/auth/logout', {
            method: 'GET',
            credentials: 'include'
        })
            .then(response => {
                if (response.ok) {
                    document.cookie = 'FA_AUTH_TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    showLoginForm();
                } else {
                    throw new Error('Logout failed');
                }
            })
            .catch(error => {
                console.error('Error logging out:', error);
                showCustomError('Logout failed. Please try again.');
            });
    });

    // Генерация QR-кода
    const generateBtn = document.getElementById('generate-btn');
    const scanOutput = document.getElementById('scan-output');

    generateBtn.addEventListener('click', function () {
        const uuid = '8b081da3-1834-49ed-8b48-a8ab19068993';
        qrScanContainer.style.display = 'none';
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
            scanning = false;
        }
        fetch(`/api/qr?uuid=${uuid}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                qrCodeContainer.innerHTML = '';
                if (data.QR) {
                    const img = document.createElement('img');
                    img.src = `data:image/png;base64,${data.QR}`;
                    qrCodeContainer.appendChild(img);
                    qrCodeContainer.style.display = 'flex';
                    gsap.fromTo(qrCodeContainer,
                        { opacity: 0, scale: 0.9 },
                        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
                    );
                }
            })
            .catch(error => {
                console.error('Error:', error);
                qrCodeContainer.innerHTML = '<p style="color: white; text-align: center;">Error generating QR code</p>';
                qrCodeContainer.style.display = 'flex';
            });
    });

    // Сканирование QR-кода
    const scanBtn = document.getElementById('scan-btn');

    scanBtn.addEventListener('click', function () {
        qrCodeContainer.style.display = 'none';
        qrScanContainer.style.display = 'flex';
        if (!scanning) {
            startScanning();
        }
    });

    function startScanning() {
        if (scanning) return;
        scanning = true;

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function (stream) {
                videoStream = stream;
                const video = document.createElement('video');
                video.srcObject = stream;
                video.setAttribute('playsinline', true);
                video.play();

                const canvasElement = document.getElementById('scan-canvas');
                const canvas = canvasElement.getContext('2d');

                function tick() {
                    if (video.readyState === video.HAVE_ENOUGH_DATA) {
                        canvasElement.height = video.videoHeight;
                        canvasElement.width = video.videoWidth;
                        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                        const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: 'dontInvert',
                        });

                        if (code && scanning) {
                            sendTokenToServer(code.data);
                        }
                    }
                    if (scanning) {
                        requestAnimationFrame(tick);
                    }
                }
                requestAnimationFrame(tick);
            })
            .catch(function (error) {
                console.error('Error accessing the camera: ', error);
                scanOutput.innerHTML = "Ошибка доступа к камере. Разрешите доступ.";
                stopScanning();
            });
    }

    function sendTokenToServer(token) {
        fetch('/api/qr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "token": token }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.access_granted) {
                    scanOutput.innerHTML = "Вход успешно произведен";
                } else {
                    scanOutput.innerHTML = "В доступе отказано";
                }
                stopScanning();
            })
            .catch(error => {
                console.error('Error:', error);
                scanOutput.innerHTML = "Ошибка при отправке запроса на сервер";
                stopScanning();
            });
    }

    function stopScanning() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }
        scanning = false;
        videoStream = null;
        qrScanContainer.style.display = 'none';
    }
});
