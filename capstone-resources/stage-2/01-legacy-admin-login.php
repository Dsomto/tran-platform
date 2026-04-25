<?php
// =============================================================
// SANKOFA DIGITAL — /legacy-admin/login.php
// Source recovered from /opt/legacy-admin/ on the production box.
// This file has been online since 2019. Last touched 2021-08-14.
// =============================================================

session_start();

require_once __DIR__ . '/db.php';   // mysqli connection in $db

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    // Look up the user
    $sql = "SELECT id, username, password_hash, role FROM users
            WHERE username = '" . $username . "'
            AND password_hash = MD5('" . $password . "')
            LIMIT 1";

    $result = mysqli_query($db, $sql);

    if ($result && mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);
        $_SESSION['user_id']  = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role']     = $user['role'];

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
