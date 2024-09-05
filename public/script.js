document.getElementById('start-test').addEventListener('click', async function() {
    document.getElementById('download-speed').textContent = 'Тестування...';
    document.getElementById('upload-speed').textContent = 'Тестування...';
    document.getElementById('ping').textContent = 'Тестування...';

    const ping = await testPing();
    document.getElementById('ping').textContent = ping;
});


async function testPing() {
    const start = performance.now();
    
    try {
        await fetch(window.location.href);
    } catch (e) {
        console.error('Ping failed:', e);
    
    }
    
    const end = performance.now();
    return (end - start).toFixed(2); 
}

async function testDownloadSpeed() {
    const start = performance.now();
}

async function testUploadSpeed() {
    const fileSyzeInBytes = 10 * 1024 * 1024;
}