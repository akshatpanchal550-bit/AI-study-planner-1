(() => {
    const { storage, escapeHtml, notify } = window.StudyPlanner;
    const form = document.getElementById('taskForm');
    const list = document.getElementById('tasksList');
    const count = document.getElementById('taskCount');
    const titleInput = document.getElementById('taskTitle');
    const dateInput = document.getElementById('taskDueDate');
    const idInput = document.getElementById('taskId');
    const submitButton = document.getElementById('taskSubmit');
    const cancelEdit = document.getElementById('taskCancelEdit');
    const searchInput = document.getElementById('taskSearch');
    const sortSelect = document.getElementById('taskSort');
    let tasks = storage.read('studyPlannerTasks', []);
    let filter = 'all';

    const localDate = date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    dateInput.min = localDate(new Date());

    const render = () => {
        const term = searchInput.value.trim().toLocaleLowerCase();
        const visible = tasks.filter(task => {
            const matchesFilter = filter === 'all' || (filter === 'completed' ? task.completed : !task.completed);
            return matchesFilter && `${task.title} ${task.subject || ''}`.toLocaleLowerCase().includes(term);
        });
        visible.sort((first, second) => {
            if (sortSelect.value === 'priority') {
                const rank = { high: 0, normal: 1, low: 2 };
                return (rank[first.priority] ?? 1) - (rank[second.priority] ?? 1)
                    || (first.dueDate || '').localeCompare(second.dueDate || '')
                    || first.title.localeCompare(second.title);
            }
            if (sortSelect.value === 'title') return first.title.localeCompare(second.title);
            return (first.dueDate || '9999-12-31').localeCompare(second.dueDate || '9999-12-31')
                || first.title.localeCompare(second.title);
        });
        const pending = tasks.filter(task => !task.completed).length;
        count.textContent = `${pending} open · ${tasks.length} total`;
        if (!visible.length) {
            list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-list-check" aria-hidden="true"></i><strong>${term ? 'No tasks match your search' : filter === 'completed' ? 'No completed tasks yet' : filter === 'active' ? 'You are all caught up' : 'Your task list is clear'}</strong><span>${term || filter !== 'all' ? 'Try another search or filter, or add a task.' : 'Add a task to start planning your study week.'}</span></div>`;
            return;
        }

        list.innerHTML = visible.map(task => {
            const priority = task.priority || 'normal';
            const date = task.dueDate ? new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date';
            return `<article class="metric-card task-row" data-task-id="${escapeHtml(task.id)}">
                <button class="icon-btn task-complete" type="button" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}: ${escapeHtml(task.title)}" aria-pressed="${Boolean(task.completed)}"><i class="fa-solid ${task.completed ? 'fa-circle-check' : 'fa-circle'}" aria-hidden="true"></i></button>
                <div class="metric-copy flex-grow-1"><strong class="task-title ${task.completed ? 'text-decoration-line-through opacity-75' : ''}">${escapeHtml(task.title)}</strong><span>${escapeHtml(task.subject || 'General')} · Due ${escapeHtml(date)}</span></div>
                <span class="badge ${priority === 'high' ? 'text-bg-danger' : priority === 'low' ? 'text-bg-secondary' : 'text-bg-success'}">${escapeHtml(priority)}</span>
                <button class="btn btn-sm btn-outline-secondary task-edit" type="button" aria-label="Edit ${escapeHtml(task.title)}"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
                <button class="btn btn-sm btn-outline-danger task-delete" type="button" aria-label="Delete ${escapeHtml(task.title)}"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
            </article>`;
        }).join('');
    };

    const resetForm = () => {
        form.reset();
        idInput.value = '';
        submitButton.innerHTML = '<i class="fa-solid fa-plus me-2" aria-hidden="true"></i>Add task';
        cancelEdit.classList.add('d-none');
        dateInput.min = localDate(new Date());
    };

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const title = titleInput.value.trim();
        const dueDate = dateInput.value;
        if (!title) {
            titleInput.setCustomValidity('Enter a task name.');
            titleInput.reportValidity();
            titleInput.setCustomValidity('');
            return;
        }
        const id = idInput.value;
        const current = tasks.find(task => task.id === id);
        const task = {
            id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
            title,
            subject: document.getElementById('taskSubject').value.trim(),
            dueDate,
            priority: document.getElementById('taskPriority').value,
            completed: current?.completed || false
        };
        tasks = id ? tasks.map(item => item.id === id ? task : item) : [task, ...tasks];
        storage.write('studyPlannerTasks', tasks);
        resetForm();
        render();
        notify(id ? 'Task updated.' : 'Task added.');
    });

    cancelEdit.addEventListener('click', resetForm);
    document.querySelectorAll('.task-filter').forEach(button => button.addEventListener('click', () => {
        filter = button.dataset.filter;
        document.querySelectorAll('.task-filter').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        render();
    }));
    searchInput.addEventListener('input', render);
    sortSelect.addEventListener('change', render);

    list.addEventListener('click', event => {
        const row = event.target.closest('[data-task-id]');
        if (!row) return;
        const task = tasks.find(item => item.id === row.dataset.taskId);
        if (!task) return;
        if (event.target.closest('.task-complete')) {
            task.completed = !task.completed;
            storage.write('studyPlannerTasks', tasks);
            render();
        } else if (event.target.closest('.task-delete')) {
            tasks = tasks.filter(item => item.id !== task.id);
            storage.write('studyPlannerTasks', tasks);
            render();
            notify('Task removed.');
        } else if (event.target.closest('.task-edit')) {
            idInput.value = task.id;
            titleInput.value = task.title;
            document.getElementById('taskSubject').value = task.subject || '';
            dateInput.min = '';
            dateInput.value = task.dueDate || '';
            document.getElementById('taskPriority').value = task.priority || 'normal';
            submitButton.innerHTML = '<i class="fa-solid fa-check me-2" aria-hidden="true"></i>Save changes';
            cancelEdit.classList.remove('d-none');
            titleInput.focus();
        }
    });

    render();
    storage.subscribe('studyPlannerTasks', value => {
        tasks = value;
        render();
    });
})();