import http from 'http';
import fs from 'fs';
import path from 'path';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';

const projectRoot = process.cwd();
const app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false
}));

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

const candidates = [
    path.join(projectRoot, 'build_webpack'),
    path.join(projectRoot, 'build_gulp'),
    path.join(projectRoot, 'public')
];

function dirExists(p) {
    try {
        return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch (e) {
        return false;
    }
}

const mounted = {styles: [], js: [], img: [], root: []};

for (const cand of candidates) {
    if (!dirExists(cand)) continue;

    // css dirs
    const cssDirs = [path.join(cand, 'css'), path.join(cand, 'styles')];
    for (const cssDir of cssDirs) {
        if (dirExists(cssDir)) {
            app.use('/static/styles', express.static(cssDir));
            mounted.styles.push(cssDir);
            break;
        }
    }

    // js dir
    const jsDir = path.join(cand, 'js');
    if (dirExists(jsDir)) {
        app.use('/static/js', express.static(jsDir));
        mounted.js.push(jsDir);
    }

    // images
    const imgCandidates = [path.join(cand, 'public', 'img'), path.join(cand, 'img')];
    for (const id of imgCandidates) {
        if (dirExists(id)) {
            app.use('/static/img', express.static(id));
            mounted.img.push(id);
            break;
        }
    }

    // fallback root
    app.use('/static', express.static(cand));
    mounted.root.push(cand);
}

console.log('Static mounts for /static/styles ->', mounted.styles);
console.log('Static mounts for /static/js     ->', mounted.js);
console.log('Static mounts for /static/img    ->', mounted.img);
console.log('Static mounts for /static (root) ->', mounted.root);

// API routers
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter); // <- подключаем новый роутер

app.set('views', path.join(projectRoot, 'views'));
app.set('view engine', 'pug');

app.get('/', (req, res) => res.render('index', {title: 'Admin — Social Network'}));
app.get('/users', (req, res) => res.render('users'));
app.get('/friends/:id', (req, res) => res.render('friends', {userId: req.params.id}));
app.get('/news', (req, res) => res.render('news'));

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const server = http.createServer(app);

server.on('error', (err) => {
    console.error('HTTP server error:', err && err.stack ? err.stack : err);
});

server.listen(PORT, HOST, () => {
    console.log(`HTTP server listening on http://${HOST}:${PORT}`);
});
