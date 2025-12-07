// public/js/news.js — поддерживает режимы: friends (лента друзей) и author (посты автора)
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('input-id');
    const btn = document.getElementById('btn-load');
    const list = document.getElementById('news-list');
    const err = document.getElementById('news-error');
    const modeFriends = document.getElementById('mode-friends');
    const modeAuthor = document.getElementById('mode-author');

    function setLoading(on) {
        if (!btn) return;
        btn.disabled = on;
        btn.textContent = on ? 'Loading...' : 'Load';
    }

    function renderPostCard(p, usersMap) {
        const author = usersMap[p.authorId] || { firstName: '', lastName: p.authorId, photo: '/static/img/default.png' };
        const photo = author.photo || '/static/img/default.png';
        const card = document.createElement('div');
        card.className = 'col-12 col-md-6 mb-3';
        card.innerHTML = `
      <div class="card h-100">
        <div class="card-body d-flex gap-3 align-items-start">
          <div class="avatar-holder" style="flex:0 0 auto;">
            <img src="${photo}" class="avatar avatar-lg" onerror="this.src='/static/img/default.png'">
          </div>
          <div style="flex:1 1 auto;">
            <div class="fw-bold">${author.lastName} ${author.firstName} <small class="text-muted">(${p.authorId})</small></div>
            <div class="text-muted small">${new Date(p.date).toLocaleString()}</div>
            <p class="mt-2 mb-0">${(p.text || '').replace(/\n/g,'<br>')}</p>
          </div>
        </div>
      </div>
    `;
        return card;
    }

    // загрузка ленты друзей: /api/users/:id/news
    async function loadFriendsNews(userId) {
        const [postsRes, usersRes] = await Promise.all([
            axios.get(`/api/users/${encodeURIComponent(userId)}/news`),
            axios.get('/api/users')
        ]);
        return { posts: postsRes.data || [], users: usersRes.data || [] };
    }

    // загрузка постов автора: /api/posts?author=<id>
    async function loadAuthorPosts(userId) {
        const [postsRes, usersRes] = await Promise.all([
            axios.get(`/api/posts?author=${encodeURIComponent(userId)}`),
            axios.get('/api/users')
        ]);
        return { posts: postsRes.data || [], users: usersRes.data || [] };
    }

    async function loadNewsFor(userId) {
        if (!userId) {
            err.textContent = 'Enter a user id';
            return;
        }
        setLoading(true);
        err.textContent = '';
        list.innerHTML = '';
        try {
            // выбираем режим
            const mode = (modeAuthor && modeAuthor.checked) ? 'author' : 'friends';
            let data;
            if (mode === 'author') {
                data = await loadAuthorPosts(userId);
            } else {
                data = await loadFriendsNews(userId);
            }
            const posts = Array.isArray(data.posts) ? data.posts : [];
            const users = Array.isArray(data.users) ? data.users : [];
            const usersMap = {};
            users.forEach(u => usersMap[u.id] = u);

            if (!posts.length) {
                list.innerHTML = `<div class="col-12"><div class="alert alert-secondary">No posts found.</div></div>`;
                return;
            }

            posts.sort((a,b) => new Date(b.date) - new Date(a.date));
            const fragment = document.createDocumentFragment();
            posts.forEach(p => fragment.appendChild(renderPostCard(p, usersMap)));
            list.appendChild(fragment);
        } catch (e) {
            console.error('Failed to load news', e);
            err.textContent = 'Failed to load news: ' + (e.response?.data?.error || e.message || 'unknown error');
        } finally {
            setLoading(false);
        }
    }

    const form = document.getElementById('news-form');
    if (form) {
        form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const id = (input && input.value || '').trim();
            if (id) loadNewsFor(id);
        });
    }

    if (btn) {
        btn.addEventListener('click', () => {
            const id = (input && input.value || '').trim();
            loadNewsFor(id);
        });
    }

    window.loadNewsFor = loadNewsFor;
});
