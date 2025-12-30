const jwt = require('jsonwebtoken');

const token = "yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXBsb3llZUlkIjoiQURNSU4wMDEiLCJyb2xlIjoiYWRtaW4iLCJpZCI6MSwiaWF0IjoxNzY3MTExOTAwLCJleHAiOjE3NjcxMzcxMDB9.MkdkrA1UYKpJVegyh_FVHM2nD-7imqToKRo99wCX6ug";

const SECRET_1 = 'your-secret-key-change-in-production'; // User Service Default
const SECRET_2 = 'your-super-secret-key-change-in-production'; // Old Inventory Default

console.log("Testing token verification...");

try {
    const decoded1 = jwt.verify(token, SECRET_1);
    console.log("✅ Verified with SECRET_1 (User Service Default):", decoded1);
} catch (e) {
    console.log("❌ Failed with SECRET_1:", e.message);
}

try {
    const decoded2 = jwt.verify(token, SECRET_2);
    console.log("✅ Verified with SECRET_2 (Old Inventory Default):", decoded2);
} catch (e) {
    console.log("❌ Failed with SECRET_2:", e.message);
}
