
async function verifySignup() {
  const email = `test.user.${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  console.log(`\n--- Step 1: Testing Sign Up ---`);
  console.log(`Attempting to register: ${email}`);

  try {
    // 1. Sign Up
    const signUpRes = await fetch('http://localhost:3004/api/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email,
        password,
        branchId: 'default-branch-id'
      })
    });

    if (!signUpRes.ok) {
      const txt = await signUpRes.text();
      throw new Error(`Sign Up Failed: ${signUpRes.status} - ${txt}`);
    }

    const signUpData = await signUpRes.json();
    console.log('✅ Sign Up Successful');
    console.log('User ID:', signUpData.user.id);

    // Check cookie
    const cookie = signUpRes.headers.get('set-cookie');
    if (cookie && cookie.includes('auth_token=')) {
      console.log('✅ Auth Cookie Set on Sign Up');
    } else {
      console.error('❌ Auth Cookie MISSING on Sign Up');
    }

    // 2. Sign In (Verification)
    console.log(`\n--- Verifying Sign In ---`);
    const signInRes = await fetch('http://localhost:3004/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!signInRes.ok) throw new Error('Sign In Failed');

    const signInData = await signInRes.json();
    console.log('✅ Sign In Successful');
    console.log('Token received:', !!signInData.token);

  } catch (e) {
    console.error('❌ Verification Failed:', e);
    process.exit(1);
  }
}

verifySignup();
