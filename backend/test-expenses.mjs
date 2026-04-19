async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'thefreelancer2076@gmail.com', password: 'Blackbird@12.' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status);
    return;
  }
  
  const { accessToken } = await loginRes.json();
  console.log('Token obtained');

  const res = await fetch('http://localhost:5000/api/expenses', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  console.log(`/api/expenses: ${res.status}`);
  if (res.status !== 200) {
    console.log('Error:', await res.text());
  } else {
    const data = await res.json();
    console.log('Expenses found:', data.expenses.length);
  }
}

test();
