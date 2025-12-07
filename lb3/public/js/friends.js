// public/js/friends.js — renders friends list, no edit buttons (view-only)
document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('friends-list');
    const info = document.getElementById('friends-info');

    // Extract user id from URL (/friends/:id)
    const match = location.pathname.match(/\/friends\/([^\/]+)/);
    const userId = match ? decodeURIComponent(match[1]) : null;
    if (!userId) {
        info.textContent = 'User id not provided in URL.';
        return;
    }

    async function load() {
        try {
            info.textContent = `Loading friends for ${userId}...`;
            const [friendsRes, usersRes] = await Promise.all([
                axios.get(`/api/users/${encodeURIComponent(userId)}/friends`),
                axios.get('/api/users')
            ]);
            const friends = friendsRes.data || [];
            const users = usersRes.data || [];
            const usersMap = {};
            users.forEach(u => usersMap[u.id] = u);

            info.textContent = `Friends of ${userId} — ${friends.length} found.`;
            list.innerHTML = '';
            if (!friends.length) {
                list.innerHTML = `<div class="col-12"><div class="alert alert-secondary">No friends found.</div></div>`;
                return;
            }
            friends.forEach(f => {
                const author = usersMap[f.id] || f;
                const photo = author.photo || '/static/img/default.jpg';
                const card = document.createElement('div');
                card.className = 'col-12 col-md-4 mb-3';
                card.innerHTML = `
          <div class="card h-100">
            <div class="card-body d-flex gap-3 align-items-center">
              <img src="${photo}" class="avatar" style="width:64px;height:64px;object-fit:cover;border-radius:8px;" onerror="this.src='/static/img/default.jpg'">
              <div>
                <div class="fw-bold">${author.lastName} ${author.firstName}</div>
                <div class="text-muted small">${author.email || ''}</div>
                <div class="mt-1"><a href="/users" class="btn btn-sm btn-outline-primary">Open Users</a></div>
              </div>
            </div>
          </div>
        `;
                list.appendChild(card);
            });
        } catch (e) {
            console.error('Failed to load friends', e);
            info.textContent = 'Failed to load friends: ' + (e.response?.data?.error || e.message);
        }
    }

    load();
});
