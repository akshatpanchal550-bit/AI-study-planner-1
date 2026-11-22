(() => {
    const { storage, notify } = window.StudyPlanner;
    const form = document.getElementById('profileForm');
    const user = storage.read('studyPlannerUser', {});
    const profile = storage.read('studyPlannerProfile', {});
    const nameInput = document.getElementById('profileName');
    const programInput = document.getElementById('studyProgram');
    const goalInput = document.getElementById('weeklyGoal');

    nameInput.value = profile.displayName || user.fullName || '';
    document.getElementById('profileEmail').value = user.email || '';
    programInput.value = profile.program || '';
    goalInput.value = profile.weeklyGoal || 10;
    const renderStats = () => {
        document.getElementById('profileSubjects').textContent = String(storage.read('studyPlannerSubjects', []).length);
        document.getElementById('profileTasks').textContent = String(storage.read('studyPlannerTasks', []).filter(task => !task.completed).length);
        document.getElementById('profileNotes').textContent = String(storage.read('studyPlannerNotes', []).length);
    };
    renderStats();
    ['studyPlannerSubjects', 'studyPlannerTasks', 'studyPlannerNotes'].forEach(key => storage.subscribe(key, renderStats));

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const displayName = nameInput.value.trim();
        const weeklyGoal = Number(goalInput.value);
        if (!displayName || weeklyGoal < 1 || weeklyGoal > 80) return;
        storage.write('studyPlannerProfile', { displayName, program: programInput.value.trim(), weeklyGoal });
        document.querySelectorAll('#dashboardUser, #welcomeUser, [data-user-name]').forEach(element => element.textContent = displayName);
        notify('Profile saved.');
    });
})();