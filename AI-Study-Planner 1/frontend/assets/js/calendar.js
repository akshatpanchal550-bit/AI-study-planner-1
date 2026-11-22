(() => {
    const { storage, escapeHtml } = window.StudyPlanner;
    const grid = document.getElementById('calendarDays');
    const monthLabel = document.getElementById('calendarMonth');
    const monthSummary = document.getElementById('calendarSummary');
    const selectedLabel = document.getElementById('selectedDateLabel');
    const taskCount = document.getElementById('dayTaskCount');
    const taskList = document.getElementById('dayTasks');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let month = new Date(today.getFullYear(), today.getMonth(), 1);
    let selected = new Date(today);
    let tasks = storage.read('studyPlannerTasks', []);
    const mondayStart = storage.read('studyPlannerSettings', {}).weekStart === 'monday';
    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (mondayStart) {
        document.querySelectorAll('.calendar-weekdays span').forEach((label, index) => label.textContent = weekdayLabels[(index + 1) % 7]);
    }

    const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const sameDay = (first, second) => dateKey(first) === dateKey(second);

    const renderSelected = () => {
        const dayTasks = tasks.filter(task => task.dueDate === dateKey(selected));
        selectedLabel.textContent = selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        taskCount.textContent = `${dayTasks.length} ${dayTasks.length === 1 ? 'task' : 'tasks'}`;
        if (!dayTasks.length) {
            taskList.innerHTML = '<div class="empty-state"><i class="fa-regular fa-calendar" aria-hidden="true"></i><strong>No tasks on this day</strong><span>Use the Tasks page to add a deadline.</span></div>';
            return;
        }
        taskList.innerHTML = dayTasks.map(task => `<article class="metric-card"><span class="metric-icon"><i class="fa-solid ${task.completed ? 'fa-circle-check' : 'fa-book-open'}" aria-hidden="true"></i></span><div class="metric-copy"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.subject || 'General')} · ${task.completed ? 'Completed' : escapeHtml(task.priority || 'normal priority')}</span></div></article>`).join('');
    };

    const render = () => {
        monthLabel.textContent = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        const monthTasks = tasks.filter(task => task.dueDate?.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`)).length;
        monthSummary.textContent = `${monthTasks} scheduled ${monthTasks === 1 ? 'task' : 'tasks'}`;
        const first = new Date(month.getFullYear(), month.getMonth(), 1);
        const start = new Date(first);
        const offset = (first.getDay() - (mondayStart ? 1 : 0) + 7) % 7;
        start.setDate(first.getDate() - offset);
        const buttons = [];
        for (let index = 0; index < 42; index += 1) {
            const day = new Date(start);
            day.setDate(start.getDate() + index);
            const key = dateKey(day);
            const count = tasks.filter(task => task.dueDate === key).length;
            const classes = ['calendar-day'];
            if (day.getMonth() !== month.getMonth()) classes.push('outside-month');
            if (sameDay(day, today)) classes.push('is-today');
            if (sameDay(day, selected)) classes.push('is-selected');
            buttons.push(`<button class="${classes.join(' ')}" type="button" role="gridcell" data-date="${key}" aria-label="${escapeHtml(day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }))}${count ? `, ${count} ${count === 1 ? 'task' : 'tasks'}` : ''}" aria-pressed="${sameDay(day, selected)}"><span>${day.getDate()}</span>${count ? `<span class="calendar-day-count">${count}<span class="visually-hidden"> ${count === 1 ? 'task' : 'tasks'}</span></span>` : ''}</button>`);
        }
        grid.innerHTML = buttons.join('');
        renderSelected();
    };

    grid.addEventListener('click', event => {
        const button = event.target.closest('[data-date]');
        if (!button) return;
        const [year, monthNumber, day] = button.dataset.date.split('-').map(Number);
        selected = new Date(year, monthNumber - 1, day);
        if (selected.getMonth() !== month.getMonth()) month = new Date(selected.getFullYear(), selected.getMonth(), 1);
        render();
    });
    document.getElementById('previousMonth').addEventListener('click', () => { month.setMonth(month.getMonth() - 1); render(); });
    document.getElementById('nextMonth').addEventListener('click', () => { month.setMonth(month.getMonth() + 1); render(); });
    document.getElementById('todayButton').addEventListener('click', () => { month = new Date(today.getFullYear(), today.getMonth(), 1); selected = new Date(today); render(); });

    storage.subscribe('studyPlannerTasks', value => {
        tasks = value;
        render();
    });
    render();
})();