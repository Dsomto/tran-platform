<?php
// =============================================================
// SANKOFA DIGITAL — /legacy-admin/login.php
// Source recovered from /opt/legacy-admin/ on the production box.
// This file has been online since 2019. Last touched 2021-08-14.
//
// Note for the intern reviewing this code: the 2021 rewrite swapped PHP
// session cookies out for a hand-rolled JWT scheme so the legacy admin
// could share auth with the internal /api/v1/internal microservice.
// Every flaw the captured tokens reveal in 03-legacy-admin-tokens.txt
// (alg:none accepted, no exp/nbf, role straight from the DB row) starts
// in the code below.
// =============================================================

require_once __DIR__ . '/db.php';   // mysqli connection in $db

// Hand-rolled JWT helpers — base64url + HS256 verify if a signature is
// present, no verification at all if `alg: none`. This is the part of the
// codebase the security team have been asking to delete since 2022.
function b64url_encode($s) {
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}
function b64url_decode($s) {
    $pad = strlen($s) % 4;
    if ($pad) { $s .= str_repeat('=', 4 - $pad); }
    return base64_decode(strtr($s, '-_', '+/'));
}
function jwt_issue($payload) {
    // "rotate this before prod" — 2019-09-04, still here
    $secret = 'sankofa-legacy-admin-2019';
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $h = b64url_encode(json_encode($header));
    $p = b64url_encode(json_encode($payload));
    $sig = b64url_encode(hash_hmac('sha256', "$h.$p", $secret, true));
    return "$h.$p.$sig";
}
function jwt_verify($token) {
    $secret = 'sankofa-legacy-admin-2019';
    $parts = explode('.', $token);
    if (count($parts) < 2) { return false; }
    list($h64, $p64) = $parts;
    $header  = json_decode(b64url_decode($h64), true);
    $payload = json_decode(b64url_decode($p64), true);
    // BUG: alg honoured straight from the token. `alg:none` returns the
    // payload without ever checking a signature — this is the CVE-2015-9235
    // class of mistake. The dev who wrote it called it "library-style
    // flexibility" in the PR description.
    if (($header['alg'] ?? '') === 'none') {
        return $payload;
    }
    if (($header['alg'] ?? '') === 'HS256' && isset($parts[2])) {
        $expected = b64url_encode(hash_hmac('sha256', "$h64.$p64", $secret, true));
        return hash_equals($expected, $parts[2]) ? $payload : false;
    }
    return false;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    // Look up the user — SQL built by string concatenation, MD5 password
    // hashing, no salt. Two bug classes in one query.
    $sql = "SELECT id, username, password_hash, role FROM users
            WHERE username = '" . $username . "'
            AND password_hash = MD5('" . $password . "')
            LIMIT 1";

    $result = mysqli_query($db, $sql);

    if ($result && mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);

        // Issue a JWT with the role straight from the DB row. No exp / nbf
        // — the token is good forever. iat is the only lifecycle field.
        $token = jwt_issue([
            'uid'  => (int)$user['id'],
            'user' => $user['username'],
            'role' => $user['role'],
            'iat'  => time(),
        ]);

        // Persist in a cookie the front-end and the /api/v1/internal service
        // both read. HttpOnly only; no Secure flag, no SameSite. In transit
        // over plain HTTP wherever the perimeter forgot to enforce HTTPS.
        setcookie('legacy_admin_jwt', $token, 0, '/', '', false, true);

        // Friendly redirect — accepts ?next= from the query string
        $next = $_GET['next'] ?? '/legacy-admin/dashboard.php';
        header("Location: " . $next);
        exit;
    } else {
        $error = "Invalid credentials for user: " . $_POST['username'];
    }
}

?>
<!DOCTYPE html>
<html>
<head><title>Sankofa Legacy Admin</title></head>
<body>
  <h1>Legacy Admin Login</h1>
  <?php if (isset($error)): ?>
    <div class="error"><?php echo $error; ?></div>
  <?php endif; ?>
  <form method="post">
    <label>Username: <input name="username"></label>
    <label>Password: <input name="password" type="password"></label>
    <button type="submit">Sign in</button>
  </form>
</body>
</html>
