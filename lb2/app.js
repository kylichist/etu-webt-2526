const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const FileStoreFactory = require('session-file-store'); // <-- добавлено
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const fs = require('fs');
const expressLayouts = require('express-ejs-layouts');

const apiRouter = require('./routes/api');
const indexRouter = require('./routes/index');

const DATA_DIR = path.join(__dirname, 'data');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(BOOKS_FILE)) fs.writeFileSync(BOOKS_FILE, '[]', 'utf8');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// express-ejs-layouts middleware
app.use(expressLayouts);
app.set('layout', 'layout');

// Static
app.use('/public', express.static(path.join(__dirname, 'public')));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

// Session + passport
// Используем file store вместо MemoryStore, чтобы убрать предупреждение про MemoryStore
const FileStore = FileStoreFactory(session);
const sessionStoreOptions = {
    path: path.join(__dirname, 'sessions'),
    logFn: function() {} // чтобы не было лишних логов от FileStore
};

app.use(session({
    store: new FileStore(sessionStoreOptions),
    secret: process.env.SESSION_SECRET || 'secret-home-library',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Simple local strategy with single user (for demo). Change as needed.
// Можно заменить чтением из env: process.env.ADMIN_USER / ADMIN_PASS
const USERS = [
    { id: '1', username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'password', displayName: 'Admin' }
];
passport.use(new LocalStrategy((username, password, done) => {
    const user = USERS.find(u => u.username === username);
    if (!user) return done(null, false, { message: 'Incorrect username' });
    if (user.password !== password) return done(null, false, { message: 'Incorrect password' });
    return done(null, user);
}));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
    const user = USERS.find(u => u.id === id);
    done(null, user || null);
});

// Make user available in templates
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.messages = req.flash();
    next();
});

// Routers
app.use('/', indexRouter);
app.use('/api', apiRouter);

// Debug error handler (show stack in dev)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err && (err.stack || err));
    const stack = err && (err.stack || String(err));
    if (req.path.startsWith('/api') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(500).json({ error: 'Internal Server Error', detail: stack });
    }
    res.status(500).send(`<h1>Internal Server Error</h1><pre>${stack}</pre>`);
});

// Start server
app.listen(PORT, () => {
    console.log(`Home Library app listening at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'production'})`);
});
