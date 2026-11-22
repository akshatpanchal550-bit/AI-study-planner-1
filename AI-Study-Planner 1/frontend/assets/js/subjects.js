(() => {
	const { storage, escapeHtml, notify } = window.StudyPlanner;
	const form = document.getElementById('subjectForm');
	const container = document.getElementById('subjectsContainer');
	const fields = {
		name: document.getElementById('subjectName'),
		teacher: document.getElementById('teacherName'),
		total: document.getElementById('totalChapters'),
		completed: document.getElementById('completedChapters'),
		exam: document.getElementById('examDate'),
		difficulty: document.getElementById('difficulty')
	};
	const saveButton = form.querySelector('[type="submit"]');
	let subjects = storage.read('studyPlannerSubjects', []);
	let editingId = null;
	const dayNumber = value => {
		const [year, month, day] = value.split('-').map(Number);
		return Date.UTC(year, month - 1, day) / 86400000;
	};
	const localDateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	const cancelButton = document.createElement('button');
	cancelButton.className = 'btn btn-outline-secondary ms-2 d-none';
	cancelButton.type = 'button';
	cancelButton.textContent = 'Cancel edit';
	saveButton.parentElement.append(cancelButton);

	const validateChapters = () => {
		const total = Number(fields.total.value);
		const completed = Number(fields.completed.value);
		fields.completed.setCustomValidity(completed > total ? 'Completed chapters cannot exceed total chapters.' : '');
	};

	fields.total.addEventListener('input', validateChapters);
	fields.completed.addEventListener('input', validateChapters);
	fields.name.addEventListener('input', () => fields.name.setCustomValidity(''));

	const emptyMessage = '<div class="col-12"><div class="empty-state"><i class="fa-solid fa-book-open" aria-hidden="true"></i><strong>No subjects yet</strong><span>Add a subject to start tracking chapters and exam dates.</span></div></div>';
	const render = () => {
		if (!subjects.length) {
			container.innerHTML = emptyMessage;
		} else {
			container.innerHTML = subjects.map(subject => {
				const total = Math.max(0, Number(subject.totalChapters) || 0);
				const complete = Math.min(total, Math.max(0, Number(subject.completedChapters) || 0));
				const percent = total ? Math.round(complete / total * 100) : 0;
				const exam = subject.examDate ? new Date(`${subject.examDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';
				return `<div class="col-xl-4 col-md-6"><article class="subject-card" data-subject-id="${escapeHtml(subject.id)}"><div class="d-flex align-items-start justify-content-between gap-2"><div><span class="metric-icon mb-3"><i class="fa-solid fa-book-open" aria-hidden="true"></i></span><h4>${escapeHtml(subject.name)}</h4></div><span class="badge text-bg-success">${escapeHtml(subject.difficulty || 'Medium')}</span></div><p>${escapeHtml(subject.teacher || 'No instructor added')}</p><div class="d-flex justify-content-between small"><span>Chapter progress</span><span>${complete}/${total} · ${percent}%</span></div><div class="progress" role="progressbar" aria-label="${escapeHtml(subject.name)} chapter progress" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${percent}%"></div></div><p class="small mt-3 mb-0">Exam date: ${escapeHtml(exam)}</p><div class="subject-actions"><button class="btn btn-outline-primary subject-edit" type="button"><i class="fa-solid fa-pen me-1" aria-hidden="true"></i>Edit</button><button class="btn btn-outline-danger subject-delete" type="button"><i class="fa-solid fa-trash me-1" aria-hidden="true"></i>Delete</button></div></article></div>`;
			}).join('');
		}
		renderSummary();
	};

	const renderSummary = () => {
		const progressHeading = [...document.querySelectorAll('.glass-card h3')].find(heading => heading.textContent.includes('Subject Progress'));
		const progressContainer = progressHeading?.closest('.glass-card')?.querySelector('.mt-4');
		if (progressContainer) {
			progressContainer.innerHTML = subjects.length ? subjects.map(subject => {
				const total = Math.max(0, Number(subject.totalChapters) || 0);
				const done = Math.min(total, Math.max(0, Number(subject.completedChapters) || 0));
				const percent = total ? Math.round(done / total * 100) : 0;
				return `<div class="mb-4"><div class="d-flex justify-content-between gap-3"><strong>${escapeHtml(subject.name)}</strong><span>${percent}%</span></div><div class="progress mt-2" role="progressbar" aria-label="${escapeHtml(subject.name)} progress" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${percent}%"></div></div></div>`;
			}).join('') : '<div class="empty-state"><strong>Progress appears here when you add subjects.</strong></div>';
		}

		const statsRow = [...document.querySelectorAll('.row.mt-5.g-4')].find(row => row.querySelector('.glass-card h2'));
		if (statsRow) {
			const completedCount = subjects.filter(subject => Number(subject.totalChapters) > 0 && Number(subject.completedChapters) >= Number(subject.totalChapters)).length;
			const average = subjects.length ? Math.round(subjects.reduce((sum, subject) => sum + (Number(subject.totalChapters) ? Number(subject.completedChapters) / Number(subject.totalChapters) : 0), 0) / subjects.length * 100) : 0;
			const values = [subjects.length, completedCount, subjects.length - completedCount, `${average}%`];
			statsRow.querySelectorAll('.glass-card h2').forEach((heading, index) => heading.textContent = String(values[index] ?? 0));
			statsRow.querySelectorAll('.glass-card p').forEach((label, index) => {
				if (index === 0) label.textContent = 'Total Subjects';
				if (index === 1) label.textContent = 'Completed';
				if (index === 2) label.textContent = 'In Progress';
				if (index === 3) label.textContent = 'Average Progress';
			});
		}

		const examHeading = [...document.querySelectorAll('.glass-card h3')].find(heading => heading.textContent.includes('Upcoming Exams'));
		const examBody = examHeading?.closest('.glass-card')?.querySelector('tbody');
		if (examBody) {
			const upcoming = subjects.filter(subject => subject.examDate).sort((first, second) => first.examDate.localeCompare(second.examDate));
			examBody.innerHTML = upcoming.length ? upcoming.map(subject => {
				const due = new Date(`${subject.examDate}T00:00:00`);
				const days = dayNumber(subject.examDate) - dayNumber(localDateKey(new Date()));
				const label = days < 0 ? 'Date passed' : days <= 7 ? 'Coming up' : 'Scheduled';
				const color = days < 0 ? 'secondary' : days <= 7 ? 'warning text-dark' : 'success';
				return `<tr><td>${escapeHtml(subject.name)}</td><td>${escapeHtml(due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }))}</td><td><span class="badge text-bg-${color}">${label}</span></td></tr>`;
			}).join('') : '<tr><td colspan="3" class="text-center py-4">No exam dates added.</td></tr>';
		}
	};

	const resetForm = () => {
		form.reset();
		editingId = null;
		saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Save Subject';
		cancelButton.classList.add('d-none');
		fields.total.setCustomValidity('');
		fields.completed.setCustomValidity('');
	};

	form.addEventListener('submit', event => {
		event.preventDefault();
		validateChapters();
		const normalizedName = fields.name.value.trim().toLocaleLowerCase();
		const duplicate = subjects.some(subject => subject.id !== editingId
			&& subject.name.trim().toLocaleLowerCase() === normalizedName);
		fields.name.setCustomValidity(duplicate ? 'A subject with this name already exists.' : '');
		if (!form.reportValidity()) return;
		const name = fields.name.value.trim();
		const total = Number(fields.total.value);
		const completed = Number(fields.completed.value);
		const entry = {
			id: editingId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
			name,
			teacher: fields.teacher.value.trim(),
			totalChapters: total,
			completedChapters: completed,
			examDate: fields.exam.value,
			difficulty: fields.difficulty.value
		};
		subjects = editingId ? subjects.map(subject => subject.id === editingId ? entry : subject) : [entry, ...subjects];
		storage.write('studyPlannerSubjects', subjects);
		const wasEditing = Boolean(editingId);
		resetForm();
		render();
		notify(wasEditing ? 'Subject updated.' : 'Subject saved.');
	});

	cancelButton.addEventListener('click', resetForm);
	container.addEventListener('click', event => {
		const card = event.target.closest('[data-subject-id]');
		if (!card) return;
		const subject = subjects.find(item => item.id === card.dataset.subjectId);
		if (!subject) return;
		if (event.target.closest('.subject-delete')) {
			subjects = subjects.filter(item => item.id !== subject.id);
			storage.write('studyPlannerSubjects', subjects);
			render();
			notify('Subject deleted.');
		} else if (event.target.closest('.subject-edit')) {
			editingId = subject.id;
			fields.name.value = subject.name;
			fields.teacher.value = subject.teacher || '';
			fields.total.value = subject.totalChapters;
			fields.completed.value = subject.completedChapters;
			fields.exam.value = subject.examDate || '';
			fields.difficulty.value = subject.difficulty || 'Easy';
			saveButton.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Update Subject';
			cancelButton.classList.remove('d-none');
			fields.name.focus();
		}
	});

	render();
	storage.subscribe('studyPlannerSubjects', value => {
		subjects = value;
		render();
	});
})();
