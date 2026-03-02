const PROXY_CONFIG = {
    "/api": {
        "target": "http://localhost:2380/applinx/rest/",
        "secure": false,
        "logLevel": "debug",
        "pathRewrite": {"^/api": ""},
        "changeOrigin": true,
        "onProxyRes": function(proxyRes, req, res) {
            // Security headers on API proxy responses (dev server only)
            // DAST fixes:
            //   #1449 - removed 'https:' wildcard from img-src
            //   #1450 - removed 'unsafe-inline' and 'unsafe-eval' from script-src
            //   #1448 - added explicit frame-src, object-src, base-uri, form-action
            //   #1452 - frame-ancestors set here via HTTP header (not meta tag)
            proxyRes.headers['X-Frame-Options'] = 'SAMEORIGIN';
            proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
            proxyRes.headers['X-XSS-Protection'] = '1; mode=block';
            proxyRes.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
            proxyRes.headers['Content-Security-Policy'] =
                "default-src 'self'; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "img-src 'self' data:; " +
                "font-src 'self' data: https://fonts.gstatic.com; " +
                "connect-src 'self'; " +
                "frame-src 'none'; " +
                "frame-ancestors 'self'; " +
                "object-src 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'; " +
                "media-src 'self'; " +
                "worker-src 'self' blob:; " +
                "manifest-src 'self';";
        }
    }
};

module.exports = PROXY_CONFIG;
