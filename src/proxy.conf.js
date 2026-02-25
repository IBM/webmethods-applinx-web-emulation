const PROXY_CONFIG = {
    "/api": {
        "target": "http://localhost:2380/applinx/rest/",
        "secure": false,
        "logLevel": "debug",
        "pathRewrite": {"^/api": ""},
        "changeOrigin": true,
        "onProxyRes": function(proxyRes, req, res) {
            // Add security headers to API responses
            proxyRes.headers['X-Frame-Options'] = 'SAMEORIGIN';
            proxyRes.headers['Content-Security-Policy'] = "frame-ancestors 'self'";
            proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
            proxyRes.headers['X-XSS-Protection'] = '1; mode=block';
            proxyRes.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
        }
    }
};

module.exports = PROXY_CONFIG;

// Made with Bob
