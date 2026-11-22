
<?php

require_once __DIR__ . '/../helpers/functions.php';

require_method('POST');

$input = read_json_input();

$email = strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');

$remember = filter_var(
    $input['remember'] ?? false,
    FILTER_VALIDATE_BOOLEAN
);

if (
    filter_var($email, FILTER_VALIDATE_EMAIL) === false ||
    $password === ''
) {
    json_response([
        'error' => 'Enter a valid email address and password.'
    ], 422);
}

try {
    $database = app_database();

    $statement = $database->prepare(
        'SELECT id, full_name, email, password_hash
         FROM users
         WHERE email = :email
         LIMIT 1'
    );

    $statement->execute([
        'email' => $email
    ]);

    $user = $statement->fetch();

    if (
        !$user ||
        !password_verify($password, $user['password_hash'])
    ) {
        json_response([
            'error' => 'Email or password is incorrect.'
        ], 401);
    }

    start_app_session();

    session_regenerate_id(true);

    $_SESSION['auth_user'] = [
        'id' => (int) $user['id'],
        'fullName' => $user['full_name'],
        'email' => $user['email'],
    ];

    $_SESSION['remember'] = $remember;
    $_SESSION['issued_at'] = time();
    $_SESSION['last_activity'] = time();

    if ($remember) {
        setcookie(session_name(), session_id(), [
            'expires' => time() + 1209600,
            'path' => '/',
            'secure' => !empty($_SERVER['HTTPS']) &&
                        $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    json_response([
        'success' => true,
        'user' => $_SESSION['auth_user']
    ]);

} catch (Throwable $error) {
    handle_api_error($error);
}
