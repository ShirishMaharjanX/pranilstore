// Auto-detect API base URL.
// If the frontend is served by the Express backend on localhost:3000, use relative paths.
// Otherwise (Live Server, file://, other host/port), point directly to the backend.
(function () {
    const BACKEND_PORT = 3000;
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const rawPort = window.location.port;
    const parsedPort = parseInt(rawPort, 10);
    const currentPort = Number.isNaN(parsedPort) ? null : parsedPort;
    const isHttpPage = protocol === 'http:' || protocol === 'https:';
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0';
    const isServedByBackend = isHttpPage && isLocalHost && currentPort === BACKEND_PORT;
    const formatHostForUrl = (value) => (value && value.includes(':') ? `[${value}]` : value);
    const sameHostOrigin = host ? `http://${formatHostForUrl(host)}:${BACKEND_PORT}` : '';
    const fallbackOrigins = [
        sameHostOrigin,
        `http://localhost:${BACKEND_PORT}`,
        `http://127.0.0.1:${BACKEND_PORT}`,
        `http://[::1]:${BACKEND_PORT}`
    ].filter(Boolean);
    const uniqueFallbackOrigins = [...new Set(fallbackOrigins)];
    const backendOrigin = uniqueFallbackOrigins[0] || `http://localhost:${BACKEND_PORT}`;

    window.APP_CONFIG = {
        // Same-origin only when truly served by backend on :3000.
        apiBase: isServedByBackend ? '' : backendOrigin,
        apiBases: isServedByBackend ? [''] : uniqueFallbackOrigins,
        printApiUrl: isServedByBackend ? '/api/print-order' : `${backendOrigin}/api/print-order`,
        // Set this to your printer service endpoint URL.
        // Example: "http://192.168.1.50:8080/print"
        printerUrl: '',
    };

    if (!isServedByBackend) {
        console.warn(
            `[Config] Frontend is running from ${protocol}//${host || 'local-file'}${rawPort ? ':' + rawPort : ''}. ` +
            `API calls will go to ${backendOrigin}. ` +
            `If login fails, start backend with "npm start" and open ${backendOrigin}/ directly.`
        );
    }
})();
