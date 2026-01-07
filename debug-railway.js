const https = require('https');

const URL = 'https://tubes-iae-anugerah-resto-production.up.railway.app/graphql';

const queries = {
    Inventory: 'query { ingredients { id } }',
    User: 'query { users { id } }', // assuming users query exists or maybe `staff`
    Order: 'query { orders { id } }',
    Kitchen: 'query { kitchenOrders { id } }'
};

// Fallback if root queries are protected, try introspection for types
const introspectionQuery = `
  query {
    __schema {
      types {
        name
      }
    }
  }
`;

function sendQuery(name, query) {
    const data = JSON.stringify({ query });
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(URL, options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`[${name}] Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log(`[${name}] SUCCEEDED! This URL is likely the ${name} Service.`);
            } else {
                // console.log(`[${name}] Failed: ${body.substring(0, 50)}...`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`[${name}] Error: ${e.message}`);
    });

    req.write(data);
    req.end();
}

// First try introspection to see all types
const req = https.request(URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': JSON.stringify({ query: introspectionQuery }).length } }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const types = JSON.parse(body).data.__schema.types.map(t => t.name);
            console.log('Available Types:', types.filter(t => !t.startsWith('__')).join(', '));

            if (types.includes('Ingredient')) console.log('✅ IDENTIFIED: This is INVENTORY Service');
            if (types.includes('KitchenOrder')) console.log('✅ IDENTIFIED: This is KITCHEN Service');
            if (types.includes('User') || types.includes('Staff')) console.log('✅ IDENTIFIED: This is USER Service');
            if (types.includes('Order')) console.log('✅ IDENTIFIED: This is ORDER Service');
        } else {
            console.log('Introspection failed:', res.statusCode, body);
        }
    });
});
req.write(JSON.stringify({ query: introspectionQuery }));
req.end();
