<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/functions.php';
require_method('POST');
$input = read_json_input();

$name = trim((string) ($input['fullName'] ?? ''));
$email = strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');

if (strlen($name) < 2 || strlen($name) > 100) {
    json_response(['error' => 'Enter a name between 2 and 100 characters.'], 422);
}
if (strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    json_response(['error' => 'Enter a valid email address.'], 422);
}
if (strlen($password) < 8 || strlen($password) > 72) {
    json_response(['error' => 'Choose a password between 8 and 72 bytes.'], 422);
}

try {
    $statement = app_database()->prepare(
        'INSERT INTO users (full_name, email, password_hash) VALUES (:full_name, :email, :password_hash)'
    );
    $statement->execute([
        'full_name' => $name,
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);
    json_response(['message' => 'Account created. You can now sign in.'], 201);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        json_response(['error' => 'An account with this email already exists.'], 409);
    }
    handle_api_error($error);
} catch (Throwable $error) {
    handle_api_error($error);
}