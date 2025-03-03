document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded');
    const canvasElement = document.getElementById('canvas');
    const canvasFrame = document.querySelector('.canvas-container');
    const outputDiv = document.getElementById('output');
    if (!canvasElement || !canvasFrame || !outputDiv) {
        console.error('One or more DOM elements not found');
        return;
    }
    console.log('DOM elements found');

    const canvas = canvasElement.getContext('2d');
    if (!canvas) {
        console.error('Canvas context not available');
        return;
    }
    console.log('Canvas context initialized');

    let scanning = false;
    let videoStream = null;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(function (stream) {
            console.log('Camera access granted');
            videoStream = stream;
            const video = document.createElement('video');
            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            video.play();

            function tick() {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvasElement.height = video.videoHeight;
                    canvasElement.width = video.videoWidth;
                    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                    const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

                    // Убираем фильтр яркости для теста
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert',
                    });

                    if (code && !scanning) {
                        console.log('QR code detected:', code.data);
                        scanning = true;
                        sendTokenToServer(code.data);
                    }
                }
                if (!scanning) {
                    requestAnimationFrame(tick);
                }
            }
            requestAnimationFrame(tick);
        })
        .catch(function (error) {
            console.error('Error accessing the camera: ', error);
            outputDiv.innerHTML = "Ошибка доступа к камере. Разрешите доступ.";
        });

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
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.access_granted) {
                    outputDiv.innerHTML = "Вход успешно произведен";
                } else if (Object.keys(data).length === 0) { // Пустой ответ от сервера
                    outputDiv.innerHTML = "В доступе отказано";
                } else {
                    outputDiv.innerHTML = "В доступе отказано. Возможно, QR-код уже использован.";
                }
                stopScanning();
            })
            .catch(error => {
                console.error('Error:', error);
                outputDiv.innerHTML = "Ошибка при отправке запроса на сервер";
                stopScanning();
            });
    }

    function stopScanning() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }
        canvasElement.style.display = 'none';
        if (canvasFrame) {
            canvasFrame.style.display = 'none';
        }
        scanning = false;
        console.log('Scanning stopped');
    }
});
