const jwt = require('jsonwebtoken');
const fs = require('fs');

const SECRET = 'your-secret-key-change-in-production';

try {
    const token = fs.readFileSync('token.txt', 'utf8').trim();
    const decoded = jwt.verify(token, SECRET);
    console.log("✅ Token is VALID locally with secret:", SECRET);
    console.log("Payload:", decoded);
} catch (e) {
    console.log("❌ Token INVALID locally:", e.message);
}
