let intervalId;
let refreshIntervalId;
const refreshSeconds = 5;

document.getElementById('start-test').addEventListener('click', async function() {
    document.getElementById('download-speed').textContent = 'Тестування...';
    document.getElementById('upload-speed').textContent = 'Тестування...';
    document.getElementById('ping').textContent = 'Тестування...';
    
    await runTests();

    document.getElementById('auto-refresh-timer').style.display = 'block';
    document.getElementById('start-test').style.display = 'none';
    document.getElementById('stop-test').style.display = 'inline';

    document.getElementById('timer-seconds').textContent = refreshSeconds;

    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
    }

    refreshIntervalId = setInterval(async () => {
        const secondsElement = document.getElementById('timer-seconds');
        let seconds = parseInt(secondsElement.textContent, 10);
        if (seconds > 0) {
            secondsElement.textContent = seconds - 1;
        } else {
            secondsElement.textContent = refreshSeconds;
            await runTests();
        }
    }, 1000); 
});

document.getElementById('stop-test').addEventListener('click', function() {
    clearInterval(refreshIntervalId);
    document.getElementById('auto-refresh-timer').style.display = 'none';
    document.getElementById('start-test').style.display = 'inline';
    document.getElementById('stop-test').style.display = 'none';
});

async function runTests() {
    try {
        const ping = await testPing();
        document.getElementById('ping').textContent = `${ping} ms`;

        const downloadTime = await testDownloadSpeed();
        const downloadSpeed = downloadTime ? (10 / downloadTime).toFixed(2) : 'N/A';
        document.getElementById('download-speed').textContent = `${downloadSpeed} MB/s`;

        const uploadTime = await testUploadSpeed();
        const uploadSpeed = uploadTime ? (10 / uploadTime).toFixed(2) : 'N/A';
        document.getElementById('upload-speed').textContent = `${uploadSpeed} MB/s`;

    } catch (e) {
        console.error('Test failed:', e);
        document.getElementById('download-speed').textContent = 'Помилка';
        document.getElementById('upload-speed').textContent = 'Помилка';
        document.getElementById('ping').textContent = 'Помилка';
    }
}

async function testPing() {
    const start = performance.now();
    try {
        await fetch(window.location.href);
    } catch (e) {
        console.error('Ping failed:', e);
        return null;
    }
    const end = performance.now();
    return (end - start).toFixed(2); 
}

async function testDownloadSpeed() {
    const start = performance.now();
    try {
        await fetch('/large-file');
    } catch (e) {
        console.error("Download failed: ", e);
        return null;
    }
    const end = performance.now();
    const time = (end - start) / 1000;
    return time > 0 ? time : null;
}

async function testUploadSpeed() {
    const start = performance.now();
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(10 * 1024 * 1024)]));
    try {
        await fetch('/upload', {
            method: 'POST',
            body: formData
        });
    } catch (e) {
        console.error('Upload failed:', e);
        return null;
    }
    const end = performance.now();
    const time = (end - start) / 1000;
    return time > 0 ? time : null;
}
