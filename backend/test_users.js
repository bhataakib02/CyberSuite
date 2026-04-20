const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/admin/users', {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNmIyMzU4ZC02M2I5LTQzODMtODFlMS0zMjI5NzkzMGQxMDQiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJ0ZXN0LXNlc3Npb24iLCJpYXQiOjE3NzY1OTEyMTIsImV4cCI6MTc3NjU5NDgxMn0.qHW63poUJTp1CqeU90svE-UXvlWJZ6RGWAqqT54KJqc' }
    });
    
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data);
  }
}

test();
