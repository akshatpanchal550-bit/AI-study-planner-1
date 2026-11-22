(() => {
    const { storage, notify, setTheme } = window.StudyPlanner;
    const form = document.getElementById('settingsForm');
    const reduceMotion = document.getElementById('reduceMotion');
    const weekStart = document.getElementById('weekStart');
    const settings = storage.read('studyPlannerSettings', {});

    const applyMotionPreference = enabled => document.body.classList.toggle('reduce-motion', enabled);
    reduceMotion.checked = Boolean(settings.reduceMotion);
    weekStart.value = settings.weekStart === 'monday' ? 'monday' : 'sunday';
    applyMotionPreference(reduceMotion.checked);

    const updateThemeButtons = () => document.querySelectorAll('[data-theme-choice]').forEach(button => {
        const selected = button.dataset.themeChoice === document.body.dataset.theme;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
        const theme = button.dataset.themeChoice;
        setTheme(theme);
        updateThemeButtons();
    }));
    document.getElementById('themeToggle').addEventListener('click', () => window.setTimeout(updateThemeButtons, 0));

    form.addEventListener('submit', event => {
        event.preventDefault();
        const next = { reduceMotion: reduceMotion.checked, weekStart: weekStart.value };
        storage.write('studyPlannerSettings', next);
        applyMotionPreference(next.reduceMotion);
        notify('Preferences saved.');
    });
    updateThemeButtons();
})();