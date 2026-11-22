(() => {
    const { storage, escapeHtml, notify } = window.StudyPlanner;
    const preferenceDefaults = { due: true, completed: true };
    const list = document.getElementById('notificationList');
    const count = document.getElementById('unreadCount');
    const duePreference = document.getElementById('duePreference');
    const completedPreference = document.getElementById('completedPreference');
    const search = document.getElementById('notificationSearch');
    let preferences = { ...preferenceDefaults, ...storage.read('studyPlannerNotificationPreferences', {}) };
    let tasks = storage.read('studyPlannerTasks', []);
    let readIds = storage.read('studyPlannerReadNotifications', []);
    let dismissedIds = storage.read('studyPlannerDismissedNotifications', []);
    let filter = 'all';
    duePreference.checked = preferences.due;
    completedPreference.checked = preferences.completed;

    const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayNumber = key => {
        const [year, month, day] = key.split('-').map(Number);
        return Date.UTC(year, month - 1, day) / 86400000;
    };
    const buildUpdates = () => {
        const today = dateKey(new Date());
        const updates = [];
        tasks.forEach(task => {
            if (preferences.due && !task.completed && task.dueDate) {
                const daysUntilDue = dayNumber(task.dueDate) - dayNumber(today);
                if (daysUntilDue <= 7) {
                    updates.push({
                        id: `due-${task.id}`,
                        task,
                        kind: daysUntilDue < 0 ? 'overdue' : daysUntilDue === 0 ? 'due' : 'upcoming',
                        date: task.dueDate
                    });
                }
            }
            if (preferences.completed && task.completed) {
                updates.push({ id: `done-${task.id}`, task, kind: 'completed', date: task.dueDate });
            }
        });
        return updates
            .filter(update => !dismissedIds.includes(update.id))
            .sort((first, second) => (first.date || '').localeCompare(second.date || ''));
    };

    const render = () => {
        const updates = buildUpdates();
        const unreadCount = updates.filter(update => !readIds.includes(update.id)).length;
        count.textContent = `${unreadCount} unread`;
        const term = search.value.trim().toLocaleLowerCase();
        const visible = updates.filter(update => {
            const isRead = readIds.includes(update.id);
            const matchesFilter = filter === 'all'
                || (filter === 'unread' && !isRead)
                || (filter === 'due' && update.kind !== 'completed')
                || (filter === 'completed' && update.kind === 'completed');
            const matchesSearch = `${update.task.title} ${update.task.subject || ''}`.toLocaleLowerCase().includes(term);
            return matchesFilter && matchesSearch;
        });
        if (!visible.length) {
            const hasUpdates = updates.length > 0;
            list.innerHTML = `<div class="empty-state"><i class="fa-regular fa-bell-slash" aria-hidden="true"></i><strong>${hasUpdates ? 'No updates match this filter' : 'You are all caught up'}</strong><span>${hasUpdates ? 'Try another search or filter.' : 'Upcoming task reminders will appear here.'}</span></div>`;
            return;
        }
        list.innerHTML = visible.map(update => {
            const message = update.kind === 'overdue'
                ? 'Past due'
                : update.kind === 'due'
                    ? 'Due today'
                    : update.kind === 'upcoming'
                        ? 'Due soon'
                        : 'Task completed';
            const date = update.date
                ? new Date(`${update.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '';
            const isRead = readIds.includes(update.id);
            return `<article class="notification-item ${isRead ? 'is-read' : 'is-unread'}" data-notification-id="${escapeHtml(update.id)}"><span class="metric-icon"><i class="fa-solid ${update.kind === 'completed' ? 'fa-circle-check' : 'fa-calendar-day'}" aria-hidden="true"></i></span><div class="metric-copy"><strong>${escapeHtml(update.task.title)}</strong><span>${escapeHtml(message)}${date ? ` · ${escapeHtml(date)}` : ''} · ${escapeHtml(update.task.subject || 'General')}</span></div><a class="btn btn-sm btn-outline-secondary" href="tasks.html">Open tasks</a><button class="icon-btn mark-read" type="button" aria-label="Mark ${escapeHtml(update.task.title)} as ${isRead ? 'unread' : 'read'}" aria-pressed="${isRead}"><i class="fa-solid ${isRead ? 'fa-envelope' : 'fa-envelope-open'}" aria-hidden="true"></i></button><button class="icon-btn dismiss-notification" type="button" aria-label="Dismiss ${escapeHtml(update.task.title)}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></article>`;
        }).join('');
    };

    document.getElementById('saveNotificationPrefs').addEventListener('click', () => {
        preferences = { due: duePreference.checked, completed: completedPreference.checked };
        storage.write('studyPlannerNotificationPreferences', preferences);
        render();
        notify('Notification preferences saved.');
    });
    document.getElementById('markAllRead').addEventListener('click', () => {
        readIds = [...new Set([...readIds, ...buildUpdates().map(update => update.id)])];
        storage.write('studyPlannerReadNotifications', readIds);
        render();
        notify('All updates marked as read.');
    });
    search.addEventListener('input', render);
    document.querySelectorAll('.notification-filter').forEach(button => button.addEventListener('click', () => {
        filter = button.dataset.filter;
        document.querySelectorAll('.notification-filter').forEach(item => {
            item.setAttribute('aria-pressed', String(item === button));
        });
        render();
    }));
    list.addEventListener('click', event => {
        const notification = event.target.closest('[data-notification-id]');
        if (!notification) return;
        const id = notification.dataset.notificationId;
        if (event.target.closest('.mark-read')) {
            readIds = readIds.includes(id) ? readIds.filter(item => item !== id) : [...readIds, id];
            storage.write('studyPlannerReadNotifications', readIds);
        } else if (event.target.closest('.dismiss-notification')) {
            dismissedIds = [...new Set([...dismissedIds, id])];
            storage.write('studyPlannerDismissedNotifications', dismissedIds);
            notify('Update dismissed.');
        } else {
            return;
        }
        render();
    });

    storage.subscribe('studyPlannerTasks', value => {
        tasks = value;
        render();
    });
    storage.subscribe('studyPlannerReadNotifications', value => {
        readIds = value;
        render();
    });
    storage.subscribe('studyPlannerDismissedNotifications', value => {
        dismissedIds = value;
        render();
    });
    storage.subscribe('studyPlannerNotificationPreferences', value => {
        preferences = { ...preferenceDefaults, ...value };
        duePreference.checked = preferences.due;
        completedPreference.checked = preferences.completed;
        render();
    }, {});
    render();
})();
