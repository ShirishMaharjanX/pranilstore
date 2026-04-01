// Auto-detect API base URL.
(function () {
    const BACKEND_PORT = 3000;
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const rawPort = window.location.port;
    const isHttpPage = protocol === 'http:' || protocol === 'https:';
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0';
    const isSameOrigin = isHttpPage && host && host.length > 0;

    window.APP_CONFIG = {
        apiBase: '',
        apiBases: [''],
        printApiUrl: '/api/print-order',
        printerUrl: '',
    };

    if (!isSameOrigin) {
        console.warn('[Config] Running from file:// or unknown origin, API calls may fail.');
    }
})();
