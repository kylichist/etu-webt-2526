// Utilities for routers
module.exports = {
    ensureAuth: function(req, res, next) {
        // For simplicity: allow read-only endpoints without auth, protect mutation endpoints.
        if (req.isAuthenticated && req.isAuthenticated()) return next();
        // If AJAX request, return 401 JSON, else redirect to login
        const acceptsJson = req.headers['accept'] && req.headers['accept'].includes('application/json');
        if (acceptsJson || req.xhr) return res.status(401).json({ error: 'Unauthorized' });
        return res.redirect('/login');
    }
};
