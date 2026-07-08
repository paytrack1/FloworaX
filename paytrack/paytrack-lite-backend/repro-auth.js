const fetch = global.fetch;
(async () => {
  const email = `test-${Date.now()}@example.com`;
  const businessName = `TestCo-${Date.now()}`;
  const password = 'testpass';
  const base = 'http://localhost:3000';
  try {
    const reg = await fetch(`${base}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, businessName, password })
    });
    console.log('register status', reg.status);
    console.log(await reg.text());
  } catch (err) {
    console.error('register error', err);
    return;
  }
  try {
    const login = await fetch(`${base}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    console.log('login status', login.status);
    const loginBody = await login.text();
    console.log(loginBody);
    if (!login.ok) return;
    const { token } = JSON.parse(loginBody);
    const me = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('/me status', me.status);
    console.log(await me.text());
    const profile = await fetch(`${base}/api/auth/profile`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ businessType: 'tester' })
    });
    console.log('/profile status', profile.status);
    console.log(await profile.text());
  } catch (err) {
    console.error('rest error', err);
  }
})();
