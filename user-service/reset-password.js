const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetPassword() {
    const conn = await mysql.createConnection({
        host: 'user-db',
        user: 'root',
        password: 'rootpassword',
        database: 'user_db'
    });

    const hash = await bcrypt.hash('admin123', 10);
    console.log('Generated hash:', hash);

    await conn.execute(
        'UPDATE staff SET password_hash = ? WHERE username = ?',
        [hash, 'admin']
    );

    console.log('Password updated for username: admin');
    await conn.end();
}

resetPassword().catch(console.error);
