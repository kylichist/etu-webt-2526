document.addEventListener('DOMContentLoaded', () => {
    // elements
    const usersTable = document.getElementById('users-table');
    const btnNew = document.getElementById('btn-new');
    const modalEl = document.getElementById('userModal');
    const bsModal = new bootstrap.Modal(modalEl);
    const btnSave = document.getElementById('btn-save');
    const btnDelete = document.getElementById('btn-delete');
    const modalTitle = document.getElementById('modalTitle');
    const searchInput = document.getElementById('users-search');
    const avatarFileField = document.getElementById('avatarFile');
    const avatarPreview = document.getElementById('avatarPreview');
    const toastContainer = document.getElementById('toastContainer');

    const uidField = document.getElementById('uid');
    const firstNameField = document.getElementById('firstName');
    const lastNameField = document.getElementById('lastName');
    const birthDateField = document.getElementById('birthDate');
    const emailField = document.getElementById('email');
    const photoField = document.getElementById('photo');
    const roleField = document.getElementById('role');
    const statusField = document.getElementById('status');

    const errBox = document.getElementById('users-error');

    // client-side regexes (same expectations as server)
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    const NAME_RE = /^[A-Za-zА-Яа-яЁё'\-\s]{2,}$/;

    function showToast(message, opts = {}) {
        const toastEl = document.createElement('div');
        toastEl.className = 'toast align-items-center text-bg-light border';
        toastEl.role = 'alert';
        toastEl.ariaLive = 'assertive';
        toastEl.ariaAtomic = 'true';
        toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
        toastContainer.appendChild(toastEl);
        const b = new bootstrap.Toast(toastEl, { delay: opts.delay || 3000 });
        b.show();
        // cleanup after hidden
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }

    function validateFormClient() {
        const errors = [];
        if (!firstNameField.value || !NAME_RE.test(firstNameField.value.trim())) errors.push('First name must be at least 2 letters and only letters/space/-/\'.');
        if (!lastNameField.value || !NAME_RE.test(lastNameField.value.trim())) errors.push('Last name must be at least 2 letters and only letters/space/-/\'.');
        const email = emailField.value || '';
        if (!EMAIL_RE.test(email.trim())) errors.push('Email is invalid');
        const bd = birthDateField.value;
        if (bd) {
            const y = new Date(bd).getFullYear();
            const cy = new Date().getFullYear();
            if (isNaN(y) || y < 1900 || y > cy) errors.push(`Birth year must be between 1900 and ${cy}`);
        }
        if (!['user', 'admin'].includes(roleField.value)) errors.push('Role invalid');
        if (!['unverified', 'active', 'blocked'].includes(statusField.value)) errors.push('Status invalid');
        return errors;
    }

    // helper: builds table rows and stores searchable attributes
    function buildRow(u) {
        const tr = document.createElement('tr');
        tr.dataset.name = `${(u.lastName||'')} ${(u.firstName||'')}`.toLowerCase();
        tr.dataset.email = (u.email||'').toLowerCase();
        tr.innerHTML = `
      <td>
        <img src="${u.photo||'/static/img/default.jpg'}" class="avatar" onerror="this.src='/static/img/default.jpg'">
      </td>
      <td>${u.lastName} ${u.firstName}</td>
      <td>${u.birthDate || ''}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.status}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-secondary me-1" data-id="${u.id}" data-action="copy">Copy ID</button>
        <button class="btn btn-sm btn-primary me-1" data-id="${u.id}" data-action="edit">Edit</button>
        <button class="btn btn-sm btn-secondary me-1" data-id="${u.id}" data-action="friends">Friends</button>
        <button class="btn btn-sm btn-outline-danger" data-id="${u.id}" data-action="delete">Delete</button>
      </td>
    `;
        return tr;
    }

    async function loadUsers() {
        try {
            errBox.textContent = '';
            const res = await axios.get('/api/users');
            const users = res.data || [];
            usersTable.innerHTML = '';
            users.forEach(u => usersTable.appendChild(buildRow(u)));
        } catch (e) {
            console.error('Failed to load users', e);
            errBox.textContent = 'Failed to load users: ' + (e.response?.data?.error || e.message);
        }
    }

    function filterUsers(q) {
        const ql = (q || '').trim().toLowerCase();
        Array.from(usersTable.children).forEach(row => {
            if (!ql) { row.style.display = ''; return; }
            const name = row.dataset.name || '';
            const email = row.dataset.email || '';
            row.style.display = (name.includes(ql) || email.includes(ql)) ? '' : 'none';
        });
    }

    // avatar preview when selecting file
    avatarFileField?.addEventListener('change', () => {
        const f = avatarFileField.files && avatarFileField.files[0];
        if (!f) { avatarPreview.style.display = 'none'; return; }
        const url = URL.createObjectURL(f);
        avatarPreview.src = url;
        avatarPreview.style.display = '';
    });

    // Event delegation for row buttons
    usersTable.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'edit') openEdit(id);
        else if (action === 'friends') location.href = '/friends/' + id;
        else if (action === 'delete') {
            if (!confirm('Delete user?')) return;
            axios.delete('/api/users/' + id).then(() => {
                showToast('User deleted');
                loadUsers();
            }).catch(e => {
                alert('Delete failed: ' + (e.response?.data?.error || e.message));
            });
        } else if (action === 'copy') {
            navigator.clipboard?.writeText(id).then(() => showToast('ID copied to clipboard')).catch(() => showToast('Failed to copy'));
        }
    });

    function clearForm() {
        uidField.value = '';
        [firstNameField, lastNameField, birthDateField, emailField, photoField].forEach(f => f.value = '');
        avatarFileField.value = '';
        avatarPreview.style.display = 'none';
        roleField.value = 'user';
        statusField.value = 'unverified';
        modalTitle.textContent = 'Create user';
        btnDelete.style.display = 'none';
    }

    async function openEdit(id) {
        try {
            const r = await axios.get('/api/users/' + id);
            const u = r.data;
            uidField.value = u.id;
            firstNameField.value = u.firstName || '';
            lastNameField.value = u.lastName || '';
            birthDateField.value = u.birthDate || '';
            emailField.value = u.email || '';
            photoField.value = u.photo || '';
            avatarFileField.value = '';
            avatarPreview.src = u.photo || '/static/img/default.jpg';
            avatarPreview.style.display = '';
            roleField.value = u.role || 'user';
            statusField.value = u.status || 'unverified';
            modalTitle.textContent = 'Edit user';
            btnDelete.style.display = '';
            bsModal.show();
        } catch (e) {
            alert('Failed to load user: ' + (e.response?.data?.error || e.message));
        }
    }

    btnNew?.addEventListener('click', () => { clearForm(); bsModal.show(); });

    // Save (create or update)
    btnSave.addEventListener('click', async () => {
        const validation = validateFormClient();
        if (validation.length) {
            alert('Validation error:\n' + validation.join('\n'));
            return;
        }
        try {
            // upload avatar file if present
            let avatarUrl = null;
            if (avatarFileField.files && avatarFileField.files.length) {
                const fd = new FormData();
                fd.append('avatar', avatarFileField.files[0]);
                const upr = await axios.post('/api/users/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                avatarUrl = upr.data?.url || null;
            }
            const id = uidField.value;
            const payload = {
                firstName: firstNameField.value.trim(),
                lastName: lastNameField.value.trim(),
                birthDate: birthDateField.value || '',
                email: emailField.value.trim(),
                photo: avatarUrl || photoField.value.trim() || '/static/img/default.jpg',
                role: roleField.value,
                status: statusField.value
            };
            if (id) {
                await axios.put('/api/users/' + id, payload);
                showToast('Saved');
            } else {
                await axios.post('/api/users', payload);
                showToast('Created');
            }
            bsModal.hide();
            loadUsers();
        } catch (e) {
            console.error('Save failed', e);
            alert('Save failed: ' + (e.response?.data?.error || (e.response?.data?.details || e.message)));
        }
    });

    btnDelete.addEventListener('click', async () => {
        const id = uidField.value;
        if (!id) return;
        if (!confirm('Delete user?')) return;
        try {
            await axios.delete('/api/users/' + id);
            bsModal.hide();
            showToast('Deleted');
            loadUsers();
        } catch (e) {
            alert('Delete failed: ' + (e.response?.data?.error || e.message));
        }
    });

    // Search/filter
    searchInput?.addEventListener('input', (e) => filterUsers(e.target.value));

    // initial load
    loadUsers();
});
