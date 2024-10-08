let abortController;
let refreshIntervalId;
const refreshSeconds = 5;
const progressWrapper = document.getElementById('progress-wrapper');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const themeToggleButton = document.getElementById('theme-toggle');
const initialTheme = localStorage.getItem('theme') || 'light';

if (initialTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggleButton.textContent = '🌞';
}

themeToggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    themeToggleButton.textContent = theme === 'dark' ? '🌞' : '🌙';
});

document.getElementById('start-test').addEventListener('click', async function() {
    document.getElementById('download-speed').textContent = 'Тестування...';
    document.getElementById('upload-speed').textContent = 'Тестування...';
    document.getElementById('ping').textContent = 'Тестування...';

    abortController = new AbortController();
    const { signal } = abortController;

    await runTests(signal);

    document.getElementById('auto-refresh-timer').style.display = 'block';
    document.getElementById('start-test').style.display = 'none';
    document.getElementById('stop-test').style.display = 'inline';

    document.getElementById('timer-seconds').textContent = refreshSeconds;
    progressWrapper.style.display = 'block';

    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
    }

    let elapsedTime = 0;
    refreshIntervalId = setInterval(async () => {
        const secondsElement = document.getElementById('timer-seconds');
        let seconds = parseInt(secondsElement.textContent, 10);
        if (seconds > 0) {
            secondsElement.textContent = seconds - 1;
            elapsedTime += 1;
            progressBar.style.width = `${(elapsedTime / refreshSeconds) * 100}%`;
        } else {
            secondsElement.textContent = refreshSeconds;
            elapsedTime = 0;
            progressBar.style.width = '0%';
            await runTests(signal);
        }
    }, 1000);
});

document.getElementById('stop-test').addEventListener('click', function() {
    clearInterval(refreshIntervalId);
    progressBar.style.width = '0%';
    progressWrapper.style.display = 'none';
    document.getElementById('auto-refresh-timer').style.display = 'none';
    document.getElementById('start-test').style.display = 'inline';
    document.getElementById('stop-test').style.display = 'none';

    if (abortController) {
        abortController.abort();
    }

    deleteAllFiles();
});

async function runTests(signal) {
    try {
        const ping = await testPing(signal);
        document.getElementById('ping').textContent = `${ping} ms`;

        const downloadTime = await testDownloadSpeed(signal);
        const downloadSpeed = downloadTime ? (10 / downloadTime).toFixed(2) : 'N/A';
        document.getElementById('download-speed').textContent = `${downloadSpeed} MB/s`;

        const uploadTime = await testUploadSpeed(signal);
        const uploadSpeed = uploadTime ? (10 / uploadTime).toFixed(2) : 'N/A';
        document.getElementById('upload-speed').textContent = `${uploadSpeed} MB/s`;

    } catch (e) {
        if (e.name === 'AbortError') {
            console.log('Test aborted');
        } else {
            console.error('Test failed:', e);
            document.getElementById('download-speed').textContent = 'Помилка';
            document.getElementById('upload-speed').textContent = 'Помилка';
            document.getElementById('ping').textContent = 'Помилка';
        }
    }
}

async function testPing(signal) {
    const start = performance.now();
    try {
        await fetch(window.location.href, { signal });
    } catch (e) {
        if (e.name === 'AbortError') {
            console.log('Ping aborted');
            return null;
        }
        console.error('Ping failed:', e);
        return null;
    }
    const end = performance.now();
    return (end - start).toFixed(2); 
}

async function testDownloadSpeed(signal) {
    const start = performance.now();
    try {
        await fetch('/large-file', { signal });
        await fetch('/delete-file', { method: 'DELETE', signal });
    } catch (e) {
        if (e.name === 'AbortError') {
            console.log('Download aborted');
            return null;
        }
        console.error("Download failed: ", e);
        return null;
    }
    const end = performance.now();
    const time = (end - start) / 1000;
    return time > 0 ? time : null;
}

async function testUploadSpeed(signal) {
    const start = performance.now();
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(10 * 1024 * 1024)]));
    try {
        await fetch('/upload', {
            method: 'POST',
            body: formData,
            signal
        });
    } catch (e) {
        if (e.name === 'AbortError') {
            console.log('Upload aborted');
            return null;
        }
        console.error('Upload failed:', e);
        return null;
    }
    const end = performance.now();
    const time = (end - start) / 1000;
    return time > 0 ? time : null;
}

async function deleteAllFiles() {
    try {
        const response = await fetch('/delete-files', {
            method: 'DELETE'
        });
        if (response.ok) {
            console.log('All files deleted successfully');
        } else {
            console.error('Error deleting files:', response.statusText);
        }
    } catch (e) {
        console.error('Error deleting files:', e);
    }
}

function toggleCollapse() {
    const resultDiv = document.getElementById('result');
    const collapseBtn = resultDiv.querySelector('.collapse-btn');
    
    if (resultDiv.classList.contains('collapsed')) {
        resultDiv.classList.remove('collapsed');
        resultDiv.classList.add('expanded');
        collapseBtn.innerHTML = '&#9650;';
    } else {
        resultDiv.classList.remove('expanded');
        resultDiv.classList.add('collapsed');
        collapseBtn.innerHTML = '&#9660;';
    }
}

function toggleContactForm() {
    const formContainer = document.querySelector('.contact-form-container');
    const collapseBtn = document.querySelector('.contact-info .collapse-btn');
    
    if (formContainer.classList.contains('collapsed')) {
        formContainer.classList.remove('collapsed');
        formContainer.classList.add('expanded');
        collapseBtn.innerHTML = '&#9650;';
    } else {
        formContainer.classList.remove('expanded');
        formContainer.classList.add('collapsed');
        collapseBtn.innerHTML = '&#9660;';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('myForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(this);

        try {
            const response = await fetch('/submit-form', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }

            const result = await response.text();
            document.getElementById('formResponse').innerText = 'Форма надіслана успішно: ' + result;
        } catch (error) {
            console.error('Error submitting form:', error);
            document.getElementById('formResponse').innerText = 'Помилка при надсиланні форми.';
        }
    });
});
