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
            method: 'GET',
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

    // Генерация QR-кода в секции Testing
    const generateBtn = document.getElementById('generate-btn');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const qrScanContainer = document.getElementById('qr-scan-container');
    const scanOutput = document.getElementById('scan-output');
    let scanning = false;
    let videoStream = null;

    generateBtn.addEventListener('click', function () {
        const uuid = '8b081da3-1834-49ed-8b48-a8ab19068993';
        console.log('Generating QR code with UUID:', uuid);
        qrScanContainer.style.display = 'none'; // Скрываем сканер
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
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
                    qrCodeContainer.style.display = 'flex'; // Показываем QR-код
                    // Простая анимация появления QR-кода
                    gsap.fromTo(qrCodeContainer,
                        { opacity: 0, scale: 0.9 },
                        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
                    );
                } else {
                    console.error("QR code not received or missing in response!");
                    const errorMessage = document.createElement('p');
                    errorMessage.textContent = "Error: QR code not received.";
                    errorMessage.style.color = 'white';
                    errorMessage.style.textAlign = 'center';
                    qrCodeContainer.appendChild(errorMessage);
                    qrCodeContainer.style.display = 'flex';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                qrCodeContainer.innerHTML = '';
                const errorMessage = document.createElement('p');
                errorMessage.textContent = "Error generating QR code";
                errorMessage.style.color = 'white';
                errorMessage.style.textAlign = 'center';
                qrCodeContainer.appendChild(errorMessage);
                qrCodeContainer.style.display = 'flex';
            });
    });

    // Сканирование QR-кода в секции Testing
    const scanBtn = document.getElementById('scan-btn');

    scanBtn.addEventListener('click', function () {
        qrCodeContainer.style.display = 'none'; // Скрываем QR-код
        qrScanContainer.style.display = 'flex'; // Показываем сканер
        if (!scanning) {
            startScanning();
        }
    });

    function startScanning() {
        if (scanning) return;
        scanning = true;

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function (stream) {
                console.log('Camera access granted for scanning');
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
        console.log('Sending token to server:', token);
        fetch('/api/qr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "token": token }),
        })
            .then(response => {
                console.log('Server response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Server response data:', data);
                if (data.access_granted) {
                    scanOutput.innerHTML = "Вход успешно произведен";
                } else if (Object.keys(data).length === 0) { // Пустой ответ от сервера
                    scanOutput.innerHTML = "В доступе отказано";
                } else {
                    scanOutput.innerHTML = "В доступе отказано. Возможно, QR-код уже использован.";
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
        qrScanContainer.style.display = 'none'; // Скрываем сканер после завершения
        console.log('Scanning stopped');
    }
});
