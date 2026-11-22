<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/functions.php';

function authenticated_user(): ?array
{
    start_app_session();
    $user = $_SESSION['auth_user'] ?? null;
    if (!is_array($user)) {
        return null;
    }

    $now = time();
    $remember = !empty($_SESSION['remember']);
    $idleLimit = $remember ? 1209600 : 1800;
    $absoluteLimit = $remember ? 2592000 : 43200;
    $lastActivity = (int) ($_SESSION['last_activity'] ?? 0);
    $issuedAt = (int) ($_SESSION['issued_at'] ?? 0);

    if ($lastActivity === 0 || $issuedAt === 0 || $now - $lastActivity > $idleLimit || $now - $issuedAt > $absoluteLimit) {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            setcookie(session_name(), '', [
                'expires' => $now - 42000,
                'path' => '/',
                'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
        }
        session_destroy();
        return null;
    }

    $_SESSION['last_activity'] = $now;
    return $user;
}

function require_authenticated_user(): array
{
    $user = authenticated_user();
    if ($user === null) {
        json_response(['error' => 'Your session has expired. Please sign in again.'], 401);
    }
    return $user;
}