async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'thefreelancer2076@gmail.com', password: 'Blackbird@12.' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text());
    return;
  }
  
  const { token } = await loginRes.json();
  console.log('Token obtained');

  const endpoints = [
    '/api/admin/stats',
    '/api/admin/pending-verifications',
    '/api/admin/incidents',
    '/api/admin/security-rules'
  ];

  for (const endpoint of endpoints) {
    const res = await fetch(`http://localhost:5000${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`${endpoint}: ${res.status}`);
    if (res.status === 500) {
      try {
        const err = await res.json();
        console.log('Error:', err);
      } catch (e) {
        console.log('Error (not json):', await res.text());
      }
    }
  }
}

test();
