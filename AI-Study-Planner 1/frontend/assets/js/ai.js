(() => {
    const { storage, escapeHtml, notify } = window.StudyPlanner;
    const form = document.getElementById('plannerForm');
    if (!form) return;

    const fields = {
        name: document.getElementById('studentName'),
        goal: document.getElementById('goal'),
        subjects: document.getElementById('subjects'),
        hours: document.getElementById('studyHours'),
        exam: document.getElementById('examDate'),
        difficulty: document.getElementById('difficulty'),
        time: document.getElementById('studyTime'),
        breakTime: document.getElementById('breakTime')
    };
    const submit = form.querySelector('[type="submit"]');
    const planHeading = [...document.querySelectorAll('h3')].find(heading => heading.textContent.includes('AI Generated Weekly Study Plan'));
    const planCard = planHeading?.closest('.glass-card');
    const table = planCard?.querySelector('tbody');
    const exportButton = planCard?.querySelector('button');
    const saved = storage.read('studyPlannerLegacyPlan', null);
    const timeSlots = ['9:00-10:00', '10:15-11:15', '1:00-2:00', '2:15-3:15'];

    const createSchedule = data => {
        const topics = data.subjects.split(',').map(subject => subject.trim()).filter(Boolean);
        const subjects = topics.length ? topics : ['Study session'];
        const blocks = Math.max(1, Math.min(4, Math.ceil(data.hours)));
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const rows = days.map((day, dayIndex) => {
            const cells = Array.from({ length: 4 }, (_, blockIndex) => {
                if (blockIndex >= blocks) return '<td class="text-secondary">Open time</td>';
                const topic = subjects[(dayIndex + blockIndex) % subjects.length];
                return `<td><span class="schedule-topic">${escapeHtml(topic)}</span><small class="d-block text-secondary">${timeSlots[blockIndex]}</small></td>`;
            }).join('');
            return `<tr><th scope="row">${day}</th>${cells}</tr>`;
        });
        rows.push('<tr><th scope="row">Sunday</th><td colspan="4" class="text-center text-secondary">Rest, light revision, or weekly review</td></tr>');
        return rows.join('');
    };

    const showPlan = plan => {
        if (!table) return;
        table.innerHTML = createSchedule(plan);
        const notice = document.getElementById('localPlanNotice') || document.createElement('p');
        notice.id = 'localPlanNotice';
        notice.className = 'calendar-subtitle mt-2';
        notice.textContent = 'Built in this browser from your preferences. No live AI or server request was made.';
        if (!notice.isConnected) planCard.append(notice);
    };

    if (saved) showPlan(saved);
    const user = storage.read('studyPlannerUser', null);
    if (user?.fullName && !fields.name.value) fields.name.value = user.fullName;

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const data = {
            name: fields.name.value.trim(),
            goal: fields.goal.value,
            subjects: fields.subjects.value.trim(),
            hours: Number(fields.hours.value),
            examDate: fields.exam.value,
            difficulty: fields.difficulty.value,
            time: fields.time.value,
            breakTime: fields.breakTime.value
        };
        if (!data.name || data.hours < 1 || data.hours > 15) {
            notify('Enter your name and choose 1 to 15 study hours.', 'error');
            return;
        }
        submit.disabled = true;
        submit.setAttribute('aria-busy', 'true');
        submit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Building schedule';
        window.setTimeout(() => {
            storage.write('studyPlannerLegacyPlan', data);
            showPlan(data);
            submit.disabled = false;
            submit.removeAttribute('aria-busy');
            submit.innerHTML = '<i class="fa-solid fa-robot" aria-hidden="true"></i> Generate AI Study Plan';
            planCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            notify('Your study schedule is ready.');
        }, 220);
    });

    exportButton?.addEventListener('click', () => {
        const plan = storage.read('studyPlannerLegacyPlan', null);
        if (!plan) {
            notify('Build a schedule before exporting it.', 'error');
            return;
        }
        const subjectNames = plan.subjects.split(',').map(subject => subject.trim()).filter(Boolean).join(', ') || 'Study session';
        const contents = [`Study plan for ${plan.name}`, `Goal: ${plan.goal}`, `Subjects: ${subjectNames}`, `Daily study time: ${plan.hours} hours`, `Preferred time: ${plan.time}`, `Difficulty: ${plan.difficulty}`, `Break: ${plan.breakTime}`].join('\n');
        const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'study-plan.txt';
        link.click();
        URL.revokeObjectURL(url);
    });
})();