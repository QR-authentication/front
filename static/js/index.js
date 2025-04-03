document.addEventListener('DOMContentLoaded', function () {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const testingTab = document.querySelector('.nav-tab[data-tab="testing"]');
    const testingDescription = document.getElementById('testing-description');
    const authContainer = document.getElementById('auth-container');
    const qrActions = document.getElementById('qr-actions');
    const logoutBtn = document.getElementById('logout-btn');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const qrScanContainer = document.getElementById('qr-scan-container');
    let scanning = false;
    let videoStream = null;
    let loginFormHandlerSet = false;

    navTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            gsap.fromTo(`#${tabId}`,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            );
            if (tabId !== 'testing') {
                hideQrElements();
            }
            if (tabId === 'testing') {
                checkAuthStatus();
            }
        });
    });

    if (testingTab.classList.contains('active')) {
        checkAuthStatus();
    }

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

    function showLoginForm() {
        testingDescription.style.display = 'none';
        authContainer.style.display = 'flex';
        qrActions.style.display = 'none';
        logoutBtn.style.display = 'none';
        hideQrElements();
        setupLoginForm();
    }

    function showTestingFeatures() {
        testingDescription.style.display = 'block';
        authContainer.style.display = 'none';
        qrActions.style.display = 'block';
        logoutBtn.style.display = 'block';
    }

    function hideQrElements() {
        qrCodeContainer.style.display = 'none';
        qrScanContainer.style.display = 'none';
        document.getElementById('scan-output').innerHTML = '';
        stopScanning();
    }

    function showCustomError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        gsap.to(errorDiv, {
            opacity: 0,
            duration: 0.5,
            delay: 2.5,
            ease: 'power2.out',
            onComplete: () => errorDiv.remove()
        });
    }

    function setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        const loginInput = document.getElementById('login');
        const passwordInput = document.getElementById('password');

        if (loginForm && !loginFormHandlerSet) {
            loginForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const login = loginInput.value.trim();
                const password = passwordInput.value.trim();
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

    const generateBtn = document.getElementById('generate-btn');
    const scanOutput = document.getElementById('scan-output');

    generateBtn.addEventListener('click', function () {
        qrScanContainer.style.display = 'none';
        scanOutput.innerHTML = '';
        stopScanning();
        fetch('/api/qr', {
            method: 'GET',
            credentials: 'include'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                qrCodeContainer.innerHTML = '';
                if (data.qr) {
                    const img = document.createElement('img');
                    img.src = `data:image/png;base64,${data.qr}`;
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

    const scanBtn = document.getElementById('scan-btn');

    scanBtn.addEventListener('click', function () {
        qrCodeContainer.style.display = 'none';
        qrScanContainer.style.display = 'flex';
        scanOutput.innerHTML = '';
        if (!scanning) {
            startScanning();
        }
    });

    function stopScanning() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }
        scanning = false;
        const scanBox = document.querySelector('.scan-box');
        if (scanBox) {
            scanBox.innerHTML = '<div class="canvas-container"><canvas id="scan-canvas" height="480" width="640"></canvas></div>';
        }
    }

    function startScanning() {
        if (scanning) return;
        
        // Clean up any existing scanning session
        stopScanning();
        
        scanning = true;
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function (stream) {
                videoStream = stream;
                const video = document.createElement('video');
                video.srcObject = stream;
                video.setAttribute('playsinline', true);
                video.play();
                
                const scanBox = document.querySelector('.scan-box');
                const canvasElement = document.getElementById('scan-canvas');
                
                if (!canvasElement || !scanBox) {
                    throw new Error('Required elements not found');
                }
                
                const canvas = canvasElement.getContext('2d');
                if (!canvas) {
                    throw new Error('Could not get canvas context');
                }
                
                scanBox.innerHTML = '';
                scanBox.appendChild(video);
                
                function tick() {
                    if (!scanning || !video || !canvasElement || !canvas) return;
                    
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
                console.error('Error accessing the camera:', error);
                scanning = false;
                if (videoStream) {
                    videoStream.getTracks().forEach(track => track.stop());
                    videoStream = null;
                }
                showCustomError('Could not access the camera. Please make sure you have granted camera permissions.');
            });
    }

    function sendTokenToServer(token) {
        fetch('/api/qr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "Token": token }),
            credentials: 'include'
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
                stopScanningButKeepMessage();
            })
            .catch(error => {
                console.error('Error:', error);
                scanOutput.innerHTML = "Ошибка при отправке запроса на сервер";
                stopScanningButKeepMessage();
            });
    }

    function stopScanningButKeepMessage() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
            scanning = false;

            const scanBox = document.querySelector('.scan-box');
            const videoElement = scanBox.querySelector('video');
            if (videoElement) {
                videoElement.remove();
            }

            qrScanContainer.style.display = 'flex';
        }
    }
});
