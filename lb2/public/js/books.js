// Client-side script: loads list via AJAX and handles filtering, deletion via dialog
document.addEventListener('DOMContentLoaded', function(){
    const listEl = document.getElementById('booksList');
    const filterForm = document.getElementById('filterForm');
    const applyBtn = document.getElementById('applyFilter');
    const resetBtn = document.getElementById('resetFilter');

    async function loadBooks() {
        const params = new URLSearchParams();
        const q = document.getElementById('search').value.trim();
        if (q) params.append('search', q);
        const available = document.getElementById('available').value;
        if (available !== '') params.append('available', available);
        const dueBefore = document.getElementById('dueBefore').value;
        if (dueBefore) params.append('dueBefore', dueBefore);

        const res = await fetch('/api/books?' + params.toString());
        const books = await res.json();
        renderList(books);
    }

    function renderList(books) {
        if (!books || !books.length) {
            listEl.innerHTML = '<div class="w3-panel w3-white w3-padding">Книги не найдены.</div>';
            return;
        }
        const rows = books.map(b => {
            const cover = b.cover ? `<img src="${b.cover}" class="book-cover-thumb" />` : `<div style="width:80px;height:100px;background:#EEE;display:flex;align-items:center;justify-content:center">No</div>`;
            const holder = b.available ? '' : `<div><i class="fa fa-user"></i> ${b.holder} — до ${b.dueDate}</div>`;
            const actions = `
        <div class="book-actions">
          <a class="w3-button w3-light-grey" href="/books/${b.id}"><i class="fa fa-info-circle"></i> Открыть</a>
        </div>`;
            return `<div class="w3-card w3-padding book-card">
        <div class="book-item">
          ${cover}
          <div style="flex:1">
            <h4 style="margin:0">${b.title} <small>— ${b.author}</small></h4>
            <div>Год: ${b.year || '-'}</div>
            <div>${b.available ? '<span class="w3-tag w3-green">В наличии</span>' : '<span class="w3-tag w3-orange">Выдана</span>'} ${holder}</div>
          </div>
          ${actions}
        </div>
      </div>`;
        });
        listEl.innerHTML = rows.join('');
    }

    const availableEl = document.getElementById('available');
    const dueBeforeEl = document.getElementById('dueBefore');
    if (availableEl) availableEl.addEventListener('change', loadBooks);
    if (dueBeforeEl) dueBeforeEl.addEventListener('change', loadBooks);

    applyBtn.addEventListener('click', (e) => { e.preventDefault(); loadBooks(); });
    resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        filterForm.reset();
        loadBooks();
    });

    // initial load
    loadBooks();
});
