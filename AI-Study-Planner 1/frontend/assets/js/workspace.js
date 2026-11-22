(() => {
    const protectedPages = [
        'dashboard.html',
        'ai-planner.html',
        'planner.html',
        'tasks.html',
        'subjects.html',
        'calendar.html',
        'analytics.html',
        'notes.html',
        'pomodoro.html',
        'notifications.html',
        'profile.html',
        'settings.html'
    ];
    const page = location.pathname.split('/').pop() || 'dashboard.html';
    const isProtectedPage = protectedPages.includes(page);

    if (isProtectedPage) {
        fetch(new URL('../backend/auth/session.php', window.location.href), {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        }).then(async response => {
            let result;
            try {
                result = await response.json();
            } catch {
                window.location.replace('login.html');
                return;
            }
            if (!response.ok || !result?.authenticated) {
                window.location.replace('login.html');
            }
        }).catch(() => {
            window.location.replace('login.html');
        });
    }

    const meta = selector => document.querySelector(selector)?.content || '';
    const userId = meta('meta[name="study-user-id"]');
    const authenticatedUser = {
        id: userId,
        fullName: meta('meta[name="study-user-name"]'),
        email: meta('meta[name="study-user-email"]')
    };
    const scopedKey = key => userId ? `studyPlanner:user:${userId}:${key}` : key;
    const legacyDataKeys = [
        'studyPlannerTasks', 'studyPlannerSubjects', 'studyPlannerNotes', 'studySessions',
        'studyPlannerProfile', 'studyPlannerSettings', 'studyPlannerNotificationPreferences',
        'studyPlannerReadNotifications', 'studyPlannerLegacyPlan', 'studyPlannerTimerMode',
        'plannerFormData', 'savedStudyPlan', 'studyNotes'
    ];

    if (userId && !localStorage.getItem('studyPlannerLocalDataMigrated')) {
        legacyDataKeys.forEach(key => {
            const legacyValue = localStorage.getItem(key);
            if (legacyValue !== null && localStorage.getItem(scopedKey(key)) === null) {
                const value = key === 'studyNotes' || key === 'savedStudyPlan'
                    ? JSON.stringify(legacyValue)
                    : legacyValue;
                localStorage.setItem(scopedKey(key), value);
            }
        });
        localStorage.setItem('studyPlannerLocalDataMigrated', 'true');
    }

    if (userId) {
        localStorage.removeItem('studyPlannerUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
    }

    const storage = {
        read(key, fallback) {
            try {
                const value = localStorage.getItem(scopedKey(key));
                if (value === null) return fallback;
                const parsed = JSON.parse(value);
                const valid = Array.isArray(fallback)
                    ? Array.isArray(parsed)
                    : fallback !== null && typeof fallback === 'object'
                        ? parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
                        : typeof parsed === typeof fallback;
                if (!valid) {
                    console.warn(`Ignoring invalid browser data for "${key}".`);
                    return fallback;
                }
                return parsed;
            } catch (error) {
                console.warn(`Unable to read browser data for "${key}".`, error);
                return fallback;
            }
        },
        write(key, value) {
            const storageKey = scopedKey(key);
            try {
                localStorage.setItem(storageKey, JSON.stringify(value));
            } catch (error) {
                notify('Your browser could not save this change. Check available storage and try again.', 'error');
                throw error;
            }
            window.dispatchEvent(new CustomEvent('studyplanner:storage', { detail: { key: storageKey } }));
        },
        remove(key) {
            const storageKey = scopedKey(key);
            localStorage.removeItem(storageKey);
            window.dispatchEvent(new CustomEvent('studyplanner:storage', { detail: { key: storageKey } }));
        },
        subscribe(key, callback, fallback = []) {
            const storageKey = scopedKey(key);
            const update = () => callback(storage.read(key, fallback));
            const onStorage = event => {
                if (event.key === storageKey || event.key === null) update();
            };
            const onLocalStorage = event => {
                if (event.detail?.key === storageKey) update();
            };
            window.addEventListener('storage', onStorage);
            window.addEventListener('studyplanner:storage', onLocalStorage);
            return () => {
                window.removeEventListener('storage', onStorage);
                window.removeEventListener('studyplanner:storage', onLocalStorage);
            };
        }
    };

    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);

    const notify = (message, type = 'success') => {
        let region = document.querySelector('.toast-region');
        if (!region) {
            region = document.createElement('div');
            region.className = 'toast-region';
            region.setAttribute('aria-live', 'polite');
            region.setAttribute('aria-atomic', 'false');
            document.body.append(region);
        }

        const toast = document.createElement('div');
        toast.className = 'app-toast';
        toast.dataset.type = type;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        const icon = document.createElement('i');
        icon.className = `fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`;
        icon.setAttribute('aria-hidden', 'true');
        const text = document.createElement('span');
        text.textContent = message;
        toast.append(icon, text);
        region.append(toast);
        window.setTimeout(() => toast.remove(), 3600);
    };

    const applyTheme = theme => {
        const normalized = theme === 'dark' ? 'dark' : 'light';
        document.body.dataset.theme = normalized;
        document.body.classList.toggle('dark-theme', normalized === 'dark');
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.setAttribute('aria-label', normalized === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
            toggle.setAttribute('aria-pressed', String(normalized === 'dark'));
            toggle.innerHTML = `<i class="fa-solid ${normalized === 'dark' ? 'fa-sun' : 'fa-moon'}" aria-hidden="true"></i>`;
        }
    };

    const setTheme = theme => {
        const normalized = theme === 'dark' ? 'dark' : 'light';
        localStorage.setItem('theme', normalized);
        localStorage.removeItem('plannerTheme');
        applyTheme(normalized);
    };

    const storedTheme = localStorage.getItem('theme') || localStorage.getItem('plannerTheme') || 'light';
    applyTheme(storedTheme);

    const activePage = page === 'ai-planner.html' ? 'planner.html' : page;
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        const item = link.closest('li');
        const isCurrent = link.getAttribute('href')?.split('/').pop() === activePage;
        item?.classList.toggle('active', isCurrent);
        if (isCurrent) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });

    const user = storage.read('studyPlannerUser', null);
    if (userId && !user) {
        storage.write('studyPlannerUser', {
            fullName: authenticatedUser.fullName,
            email: authenticatedUser.email
        });
    }
    const profile = storage.read('studyPlannerProfile', {});
    const name = profile.displayName || authenticatedUser.fullName || user?.fullName || 'Student';
    document.body.classList.toggle('reduce-motion', Boolean(storage.read('studyPlannerSettings', {}).reduceMotion));
    document.querySelectorAll('#dashboardUser, #welcomeUser, [data-user-name]').forEach(element => {
        element.textContent = name;
    });

    let sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.dashboard-navbar, .topbar');
    let leftSection = header?.querySelector('.left-section');
    if (!leftSection && header?.classList.contains('topbar')) {
        leftSection = header.firstElementChild;
        leftSection?.classList.add('left-section');
    }
    let menuToggle = document.getElementById('menuToggle');
    if (sidebar && leftSection && !menuToggle) {
        menuToggle = document.createElement('button');
        menuToggle.id = 'menuToggle';
        menuToggle.className = 'icon-btn mobile-menu';
        menuToggle.type = 'button';
        menuToggle.setAttribute('aria-label', 'Open navigation');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
        leftSection.prepend(menuToggle);
    }

    let backdrop;
    const closeSidebar = () => {
        sidebar?.classList.remove('show');
        backdrop?.remove();
        backdrop = null;
        menuToggle?.setAttribute('aria-expanded', 'false');
    };

    menuToggle?.addEventListener('click', () => {
        const open = !sidebar.classList.contains('show');
        sidebar.classList.toggle('show', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        if (open) {
            backdrop = document.createElement('button');
            backdrop.className = 'sidebar-backdrop';
            backdrop.type = 'button';
            backdrop.setAttribute('aria-label', 'Close navigation');
            backdrop.addEventListener('click', closeSidebar, { once: true });
            document.body.append(backdrop);
        } else {
            closeSidebar();
        }
    });

    document.querySelectorAll('.sidebar-menu a').forEach(link => link.addEventListener('click', closeSidebar));
    window.addEventListener('resize', () => {
        if (window.innerWidth > 820) closeSidebar();
    });

    document.querySelectorAll('img').forEach(image => {
        const replaceMissingImage = () => {
            const fallback = document.createElement('span');
            fallback.className = 'image-fallback';
            fallback.setAttribute('role', 'img');
            fallback.setAttribute('aria-label', image.alt || 'Image unavailable');
            fallback.innerHTML = '<i class="fa-regular fa-user" aria-hidden="true"></i>';
            image.replaceWith(fallback);
        };
        image.addEventListener('error', replaceMissingImage, { once: true });
        if (image.complete && image.naturalWidth === 0) replaceMissingImage();
    });

    const loader = document.getElementById('loader');
    if (loader) {
        const hideLoader = () => {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            window.setTimeout(() => loader.remove(), 450);
        };
        if (document.readyState === 'complete') hideLoader();
        else window.addEventListener('load', hideLoader, { once: true });
    }

    document.getElementById('themeToggle')?.addEventListener('click', () => {
        const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    });

    if (sidebar) {
        let logoutButton = document.getElementById('logoutBtn');
        if (!logoutButton) {
            logoutButton = document.createElement('button');
            logoutButton.id = 'logoutBtn';
            logoutButton.className = 'sidebar-logout';
            logoutButton.type = 'button';
            logoutButton.innerHTML = '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span>Sign out</span>';
            sidebar.append(logoutButton);
        }

        logoutButton.addEventListener('click', async event => {
            event.preventDefault();
            logoutButton.disabled = true;
            try {
                const response = await fetch(new URL('../backend/auth/logout.php', window.location.href), {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: '{}'
                });
                let result;
                try {
                    result = await response.json();
                } catch {
                    throw new Error('The sign-out service returned an invalid response.');
                }
                if (!response.ok) throw new Error(result.error || 'Unable to sign out.');
                window.location.replace('login.html');
            } catch (error) {
                logoutButton.disabled = false;
                notify(error.message, 'error');
            }
        });
    }

    window.StudyPlanner = { storage, escapeHtml, notify, setTheme };
})();