(() => {
    const { storage, escapeHtml } = window.StudyPlanner;
    const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const render = () => {
        const tasks = storage.read('studyPlannerTasks', []);
        const notes = storage.read('studyPlannerNotes', []);
        const subjects = storage.read('studyPlannerSubjects', []);
        const sessions = storage.read('studySessions', []);
        const completed = tasks.filter(task => task.completed).length;
        const totalMinutes = sessions.reduce((sum, session) => sum + (Number(session.minutes) || 0), 0);
        const metrics = [
            { label: 'Tasks completed', value: `${completed}/${tasks.length}`, icon: 'fa-list-check' },
            { label: 'Focus minutes', value: String(totalMinutes), icon: 'fa-stopwatch' },
            { label: 'Subjects', value: String(subjects.length), icon: 'fa-book-open' },
            { label: 'Notes saved', value: String(notes.length), icon: 'fa-note-sticky' }
        ];
        document.getElementById('analyticsMetrics').innerHTML = metrics.map(item => `<article class="metric-card"><span class="metric-icon"><i class="fa-solid ${item.icon}" aria-hidden="true"></i></span><div class="metric-copy"><span>${item.label}</span><strong>${escapeHtml(item.value)}</strong></div></article>`).join('');

        const days = [];
        for (let offset = 6; offset >= 0; offset -= 1) {
            const day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - offset);
            const key = dateKey(day);
            const minutes = sessions.filter(session => (session.date || session.completedAt?.slice(0, 10)) === key)
                .reduce((sum, session) => sum + (Number(session.minutes) || 0), 0);
            days.push({ label: day.toLocaleDateString(undefined, { weekday: 'short' }), minutes });
        }
        const maxMinutes = Math.max(...days.map(day => day.minutes), 30);
        document.getElementById('weeklyChart').innerHTML = days.map(day => `<div class="chart-column"><span class="chart-value">${day.minutes || ''}</span><div class="chart-track"><span class="chart-bar" style="height:${Math.max(day.minutes ? day.minutes / maxMinutes * 100 : 2, 2)}%" title="${day.minutes} focus minutes"></span></div><span class="chart-label">${day.label}</span></div>`).join('');

        const progress = document.getElementById('subjectProgress');
        const names = [...new Set([...subjects.map(subject => subject.name), ...tasks.map(task => task.subject).filter(Boolean)])];
        const groups = names.map(name => {
            const matching = tasks.filter(task => task.subject === name);
            const done = matching.filter(task => task.completed).length;
            return { name, done, total: matching.length, percent: matching.length ? Math.round(done / matching.length * 100) : 0 };
        });
        progress.innerHTML = groups.length
            ? groups.map(group => `<div class="subject-progress-row"><div class="d-flex justify-content-between gap-3 mb-2"><strong>${escapeHtml(group.name)}</strong><span>${group.done}/${group.total} complete</span></div><div class="progress" role="progressbar" aria-label="${escapeHtml(group.name)} tasks complete" aria-valuenow="${group.percent}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${group.percent}%"></div></div></div>`).join('')
            : '<div class="empty-state"><i class="fa-solid fa-chart-simple" aria-hidden="true"></i><strong>No subject activity yet</strong><span>Add subjects and tasks to see a breakdown.</span></div>';
    };

    render();
    ['studyPlannerTasks', 'studyPlannerNotes', 'studyPlannerSubjects', 'studySessions'].forEach(key => storage.subscribe(key, render));
})();
