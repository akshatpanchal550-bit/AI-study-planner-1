<?php
declare(strict_types=1);

require_once __DIR__ . '/../middleware/auth.php';
require_method('GET');

$user = authenticated_user();
json_response(['authenticated' => $user !== null, 'user' => $user]);