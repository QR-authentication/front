document.getElementById('generate-btn').addEventListener('click', function () {
    const uuid = '8b081da3-1834-49ed-8b48-a8ab19068993';
    console.log('Generating QR code with UUID:', uuid);
    fetch(`/api/qr?uuid=${uuid}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const qrCodeDiv = document.getElementById('qr-code');
            qrCodeDiv.innerHTML = '';
            if (data.QR) {
                const img = document.createElement('img');
                img.src = `data:image/png;base64,${data.QR}`;
                qrCodeDiv.appendChild(img);
            } else {
                console.error("QR code not received or missing in response!");
                const errorMessage = document.createElement('p');
                errorMessage.textContent = "Error: QR code not received.";
                errorMessage.style.color = 'white';
                errorMessage.style.textAlign = 'center';
                qrCodeDiv.appendChild(errorMessage);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const qrCodeContainer = document.getElementById('qr-code');
            qrCodeContainer.innerHTML = '';
            const errorMessage = document.createElement('p');
            errorMessage.textContent = "Error generating QR code";
            errorMessage.style.color = 'white';
            errorMessage.style.textAlign = 'center';
            qrCodeContainer.appendChild(errorMessage);
        });
});
