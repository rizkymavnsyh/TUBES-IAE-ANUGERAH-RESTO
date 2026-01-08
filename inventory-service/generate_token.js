const jwt = require('jsonwebtoken');

const SECRET = 'your-secret-key-change-in-production';

const payload = {
    employeeId: "ADMIN001",
    role: "admin",
    id: 1
};

const token = jwt.sign(payload, SECRET, { expiresIn: '24h' });

const fs = require('fs');

console.log("\n✨ HERE IS A VALID ADMIN TOKEN ✨");
console.log("==================================");
console.log(token);
console.log("==================================");

fs.writeFileSync('token.txt', token);
console.log("Token saved to token.txt");
