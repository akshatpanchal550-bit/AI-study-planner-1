(() => {
    const { storage, notify } = window.StudyPlanner;
    const modes = { focus: 25, short: 5, long: 15 };
    const display = document.getElementById('timerDisplay');
    const face = document.getElementById('timerFace');
    const start = document.getElementById('startTimer');
    const pause = document.getElementById('pauseTimer');
    const reset = document.getElementById('resetTimer');
    const caption = document.getElementById('timerCaption');
    const status = document.getElementById('timerStatus');
    const todayMinutes = document.getElementById('todayFocusMinutes');
    let mode = storage.read('studyPlannerTimerMode', 'focus');
    if (!modes[mode]) mode = 'focus';
    let remaining = modes[mode] * 60;
    let interval = null;
    let running = false;

    const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const renderToday = () => {
        const sessions = storage.read('studySessions', []);
        const total = sessions.filter(session => (session.date || session.completedAt?.slice(0, 10)) === dateKey(new Date())).reduce((sum, session) => sum + (Number(session.minutes) || 0), 0);
        todayMinutes.textContent = String(total);
    };

    const render = () => {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        display.setAttribute('aria-label', `${minutes} minutes and ${seconds} seconds remaining`);
        const progress = 1 - remaining / (modes[mode] * 60);
        face.style.setProperty('--timer-progress', `${Math.max(0, Math.min(progress, 1)) * 360}deg`);
        start.disabled = running;
        pause.disabled = !running;
        document.title = running ? `${display.textContent} · Focus timer | Smart AI Study Planner` : 'Focus Timer | Smart AI Study Planner';
    };

    const finish = () => {
        clearInterval(interval);
        interval = null;
        running = false;
        remaining = 0;
        caption.textContent = mode === 'focus' ? 'Focus session complete' : 'Break complete';
        status.textContent = mode === 'focus' ? 'Nice work. Take a short break before the next block.' : 'Break finished. Return when you feel ready.';
        if (mode === 'focus') {
            try {
                const completedAt = new Date();
                const sessions = storage.read('studySessions', []);
                sessions.push({ id: String(Date.now()), minutes: modes.focus, date: dateKey(completedAt), completedAt: completedAt.toISOString() });
                storage.write('studySessions', sessions);
                renderToday();
                notify('Focus session completed. Take a short break.', 'success');
            } catch (error) {
                console.error('Unable to save the completed focus session.', error);
                status.textContent = 'Focus session complete, but this browser could not save it.';
                notify('Focus session completed, but it could not be saved.', 'error');
            }
        } else {
            notify('Break complete. Ready for another block?');
        }
        render();
    };

    const startTimer = () => {
        if (running) return;
        running = true;
        caption.textContent = mode === 'focus' ? 'In a focus block' : 'Taking a break';
        status.textContent = 'Stay with the current block. You can pause whenever you need to.';
        interval = window.setInterval(() => {
            if (remaining <= 1) finish();
            else {
                remaining -= 1;
                render();
            }
        }, 1000);
        render();
    };

    start.addEventListener('click', startTimer);
    pause.addEventListener('click', () => {
        clearInterval(interval);
        interval = null;
        running = false;
        caption.textContent = 'Paused';
        status.textContent = 'Your remaining time is saved until you resume or reset.';
        render();
    });
    reset.addEventListener('click', () => {
        clearInterval(interval);
        interval = null;
        running = false;
        remaining = modes[mode] * 60;
        caption.textContent = 'Ready when you are';
        status.textContent = 'A small, steady block is enough to begin.';
        render();
    });
    document.querySelectorAll('.timer-mode').forEach(button => button.addEventListener('click', () => {
        clearInterval(interval);
        interval = null;
        running = false;
        mode = button.dataset.mode;
        remaining = modes[mode] * 60;
        storage.write('studyPlannerTimerMode', mode);
        document.querySelectorAll('.timer-mode').forEach(item => {
            item.classList.toggle('is-active', item === button);
            item.setAttribute('aria-pressed', String(item === button));
        });
        caption.textContent = 'Ready when you are';
        status.textContent = mode === 'focus' ? 'A small, steady block is enough to begin.' : 'Take a moment away from your study materials.';
        render();
    }));

    document.querySelector(`.timer-mode[data-mode="${mode}"]`)?.click();
    renderToday();
    storage.subscribe('studySessions', renderToday);
    render();
})();