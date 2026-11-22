# AI-Study-Planner

## Local setup (WAMP / Apache + MySQL)

1. Start Apache and MySQL from the WAMP control panel.
2. Enable `pdo_mysql` and `mod_rewrite` in the PHP/Apache configuration, and allow `.htaccess` overrides for this project.
3. From the repository root, run `Copy-Item .env.example .env` in PowerShell, then set `DB_USER` and `DB_PASSWORD` in `.env` to your local MySQL credentials. `.env` is ignored by Git; do not commit it.
4. Import `database/smart_ai_study_planner.sql` into MySQL (for example, with phpMyAdmin). It creates the database and authentication table.
5. Open `http://localhost/AI-Study-Planner/frontend/`, create an account, then sign in.

The authentication endpoints use MySQL prepared statements, `password_hash()` / `password_verify()`, and an HTTP-only PHP session cookie. Apache serves the landing page through a public PHP wrapper and sends workspace HTML through a session check; opening workspace pages as local files or serving them with a static-only server is not supported.

Study tasks, subjects, notes, focus sessions, plans, and preferences are currently stored in browser local storage (namespaced per authenticated user); they are not yet persisted in MySQL or synchronized between browsers. The AI planner is local/rule-based and no AI service is configured. The remaining empty CRUD API files do not provide server persistence.