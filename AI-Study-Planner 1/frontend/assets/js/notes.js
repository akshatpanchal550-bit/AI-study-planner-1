(() => {
    const { storage, escapeHtml, notify } = window.StudyPlanner;
    const form = document.getElementById('noteForm');
    const titleInput = document.getElementById('noteTitle');
    const subjectInput = document.getElementById('noteSubject');
    const bodyInput = document.getElementById('noteBody');
    const list = document.getElementById('notesList');
    const search = document.getElementById('noteSearch');
    const count = document.getElementById('notesCount');
    const noteId = document.getElementById('noteId');
    const submitButton = document.getElementById('noteSubmit');
    const cancelEdit = document.getElementById('noteCancelEdit');
    let notes = storage.read('studyPlannerNotes', []);
    const legacyQuickNote = storage.read('studyNotes', '');
    if (legacyQuickNote?.trim() && !notes.some(note => note.id === 'dashboard-quick-note')) {
        notes.unshift({ id: 'dashboard-quick-note', title: 'Quick notes', subject: 'General', body: legacyQuickNote, pinned: false, updatedAt: new Date().toISOString() });
        storage.write('studyPlannerNotes', notes);
        storage.remove('studyNotes');
    } else if (legacyQuickNote !== '') {
        storage.remove('studyNotes');
    }

    const render = () => {
        const term = search.value.trim().toLocaleLowerCase();
        const visible = notes.filter(note => `${note.title} ${note.subject} ${note.body}`.toLocaleLowerCase().includes(term));
        count.textContent = `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`;
        if (!visible.length) {
            list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-note-sticky" aria-hidden="true"></i><strong>${term ? 'No notes match your search' : 'Your library is ready'}</strong><span>${term ? 'Try a different title or subject.' : 'Your saved notes will appear here.'}</span></div>`;
            return;
        }
        list.innerHTML = visible.map(note => `<article class="note-card" data-note-id="${escapeHtml(note.id)}">
            <div class="d-flex justify-content-between gap-3"><div class="min-w-0"><h3>${escapeHtml(note.title)}</h3><p class="note-meta">${escapeHtml(note.subject || 'General')} · ${escapeHtml(new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))}</p></div><button class="icon-btn note-pin" type="button" aria-label="${note.pinned ? 'Unpin' : 'Pin'} ${escapeHtml(note.title)}" aria-pressed="${Boolean(note.pinned)}"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i></button></div>
            <p class="note-content">${escapeHtml(note.body)}</p>
            <div class="note-actions"><button class="btn btn-sm btn-outline-secondary note-edit" type="button"><i class="fa-solid fa-pen me-1" aria-hidden="true"></i>Edit</button><button class="btn btn-sm btn-outline-danger note-delete" type="button"><i class="fa-solid fa-trash me-1" aria-hidden="true"></i>Delete</button></div>
        </article>`).join('');
    };

    const resetForm = () => {
        form.reset();
        noteId.value = '';
        document.getElementById('noteLength').textContent = '0';
        submitButton.innerHTML = '<i class="fa-solid fa-floppy-disk me-2" aria-hidden="true"></i>Save note';
        cancelEdit.classList.add('d-none');
    };

    bodyInput.addEventListener('input', () => document.getElementById('noteLength').textContent = String(bodyInput.value.length));
    search.addEventListener('input', render);

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const title = titleInput.value.trim();
        const body = bodyInput.value.trim();
        if (!title || !body) return;
        const id = noteId.value;
        const previous = notes.find(note => note.id === id);
        const entry = {
            id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
            title,
            subject: subjectInput.value.trim(),
            body,
            pinned: previous?.pinned || false,
            updatedAt: new Date().toISOString()
        };
        notes = id ? notes.map(note => note.id === id ? entry : note) : [entry, ...notes];
        storage.write('studyPlannerNotes', notes);
        if (entry.id === 'dashboard-quick-note') storage.remove('studyNotes');
        resetForm();
        render();
        notify(id ? 'Note updated.' : 'Note saved.');
    });

    cancelEdit.addEventListener('click', resetForm);
    list.addEventListener('click', event => {
        const card = event.target.closest('[data-note-id]');
        if (!card) return;
        const note = notes.find(item => item.id === card.dataset.noteId);
        if (!note) return;
        if (event.target.closest('.note-pin')) {
            note.pinned = !note.pinned;
        } else if (event.target.closest('.note-delete')) {
            notes = notes.filter(item => item.id !== note.id);
            if (note.id === 'dashboard-quick-note') storage.remove('studyNotes');
            notify('Note deleted.');
        } else if (event.target.closest('.note-edit')) {
            noteId.value = note.id;
            titleInput.value = note.title;
            subjectInput.value = note.subject || '';
            bodyInput.value = note.body;
            document.getElementById('noteLength').textContent = String(note.body.length);
            submitButton.innerHTML = '<i class="fa-solid fa-check me-2" aria-hidden="true"></i>Save changes';
            cancelEdit.classList.remove('d-none');
            titleInput.focus();
            return;
        } else {
            return;
        }
        notes.sort((first, second) => Number(second.pinned) - Number(first.pinned));
        storage.write('studyPlannerNotes', notes);
        render();
    });

    notes.sort((first, second) => Number(second.pinned) - Number(first.pinned));
    render();
    storage.subscribe('studyPlannerNotes', value => {
        notes = value.sort((first, second) => Number(second.pinned) - Number(first.pinned));
        render();
    });
})();