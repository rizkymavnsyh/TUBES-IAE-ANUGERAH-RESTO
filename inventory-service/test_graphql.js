const fetch = require('node-fetch'); // Assuming node-fetch is available, or use http
// Actually, let's use standard http to avoid dependency issues if node-fetch isn't allowed in root
const http = require('http');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8').trim();

const postData = JSON.stringify({
    query: `mutation {
    purchaseFromTokoSembako(input: {
      orderNumber: "TEST-LOCAL-01",
      items: [{productId: "1", quantity: 1}]
    }) {
      success
      message
    }
  }`
});

const options = {
    hostname: 'localhost',
    port: 4002,
    path: '/graphql',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': token, // Try without Bearer first as code supports it
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log("🚀 Sending request to http://localhost:4002/graphql...");
console.log("🔑 Token:", token.substring(0, 20) + "...");

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('BODY:', data);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
