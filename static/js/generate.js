document.getElementById('generate-btn').addEventListener('click', function () {
    const uuid = '8b081da3-1834-49ed-8b48-a8ab19068993';
    fetch(`/api/qr?uuid=${uuid}`)
        .then(response => response.json())
        .then(data => {
            const qrCodeDiv = document.getElementById('qr-code');
            qrCodeDiv.innerHTML = '';
            if (data.QR) {
                const img = document.createElement('img');
                img.src = `data:image/png;base64,${data.QR}`;
                qrCodeDiv.appendChild(img);
            } else {
                console.error("QR код не получен или отсутствует в ответе!");
                const errorMessage = document.createElement('p');
                errorMessage.textContent = "Ошибка: QR код не получен.";
                qrCodeDiv.appendChild(errorMessage);
            }
        })
        .catch(error => {
            console.error('Error:', error);

            const qrCodeContainer = document.getElementById('qr-code');
            qrCodeContainer.innerHTML = '';

            const errorMessage = document.createElement('p');
            errorMessage.textContent = "Произошла ошибка при генерации QR кода";
            errorMessage.style.color = 'white';
            errorMessage.style.textAlign = 'center';
            qrCodeContainer.appendChild(errorMessage);
        });
});
