<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/functions.php';
require_method('POST');
read_json_input();
start_app_session();

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}
session_destroy();
json_response(['message' => 'Signed out.']);