
<?php


function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');

    echo json_encode(
        $payload,
        JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

function require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method);
        json_response(['error' => 'Method not allowed.'], 405);
    }
}

function read_json_input(): array
{
    $contentType = strtolower(
        trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])
    );

    if ($contentType !== 'application/json') {
        json_response(['error' => 'Send the request as JSON.'], 415);
    }

    try {
        $data = json_decode(
            (string) file_get_contents('php://input'),
            false,
            512,
            JSON_THROW_ON_ERROR
        );
    } catch (JsonException $error) {
        json_response(['error' => 'Invalid JSON request.'], 400);
    }

    if (!$data instanceof stdClass) {
        json_response(['error' => 'Request body must be a JSON object.'], 400);
    }

    return get_object_vars($data);
}

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');

    session_name('studyplanner_session');

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    if (!session_start()) {
        throw new RuntimeException('Unable to start session.');
    }
}

function app_database(): PDO
{
    static $connection = null;

    if (!$connection instanceof PDO) {
        $connection = require __DIR__ . '/../config/database.php';
    }

    if (!$connection instanceof PDO) {
        throw new RuntimeException('Invalid database configuration.');
    }

    return $connection;
}

function handle_api_error(Throwable $error): never
{
    error_log(
        'Study Planner API error: ' .
        $error->getMessage()
    );

    json_response([
        'error' => 'The service is temporarily unavailable. Check the server configuration and try again.'
    ], 500);
}
