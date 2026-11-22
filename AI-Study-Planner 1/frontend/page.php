<?php
declare(strict_types=1);

require_once __DIR__ . '/../backend/middleware/auth.php';

$pages = [
    'index.html',
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
    'settings.html',
];
$requestedPage = basename((string) ($_GET['file'] ?? ''));
$isPublicPage = $requestedPage === 'index.html';
if (!in_array($requestedPage, $pages, true)) {
    http_response_code(404);
    exit('Page not found.');
}

$user = authenticated_user();
if (!$isPublicPage && $user === null) {
    header('Location: login.html', true, 302);
    exit;
}

$path = __DIR__ . DIRECTORY_SEPARATOR . $requestedPage;
if (!is_file($path)) {
    http_response_code(404);
    exit('Page not found.');
}

$html = file_get_contents($path);
if ($html === false) {
    http_response_code(500);
    exit('Unable to load the requested page.');
}

if ($user !== null) {
    $meta = sprintf(
        '<meta name="study-user-id" content="%s"><meta name="study-user-name" content="%s"><meta name="study-user-email" content="%s">',
        htmlspecialchars((string) $user['id'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
        htmlspecialchars((string) $user['fullName'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
        htmlspecialchars((string) $user['email'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
    );
    $html = preg_replace('/<\/head>/i', $meta . '</head>', $html, 1);
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
echo $html;
