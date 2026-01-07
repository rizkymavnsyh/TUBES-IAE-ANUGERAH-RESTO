const axios = require('axios');

async function testUserService() {
    try {
        const query = `
      query GetChefs {
        staff(role: chef, status: active) {
          id
          employeeId
          name
          role
          department
          status
        }
      }
    `;

        console.log('Querying User Service at http://localhost:4003/graphql ...');
        const response = await axios.post('http://localhost:4003/graphql', {
            query: query
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.errors) {
            console.error('Errors:', JSON.stringify(response.data.errors, null, 2));
        } else {
            console.log('Data:', JSON.stringify(response.data.data, null, 2));
        }
    } catch (error) {
        console.error('Network Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

testUserService();
