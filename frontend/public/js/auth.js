document.addEventListener('DOMContentLoaded', () => {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const loginText = document.getElementById('loginText');
            const loginSpinner = document.getElementById('loginSpinner');
            
            loginText.textContent = 'Logging in...';
            loginSpinner.style.display = 'inline-block';
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'Login failed');
                }
                
                // Save token and redirect
                localStorage.setItem('token', data.token);
                window.location.href = 'dashboard.html';
            } catch (err) {
                alert(err.message);
            } finally {
                loginText.textContent = 'Login';
                loginSpinner.style.display = 'none';
            }
        });
    }
    
    // Signup Form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const referralCode = document.getElementById('referralCode').value;
            
            const signupText = document.getElementById('signupText');
            const signupSpinner = document.getElementById('signupSpinner');
            
            signupText.textContent = 'Signing up...';
            signupSpinner.style.display = 'inline-block';
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password, referralCode })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'Signup failed');
                }
                
                // Save token and redirect
                localStorage.setItem('token', data.token);
                window.location.href = 'dashboard.html';
            } catch (err) {
                alert(err.message);
            } finally {
                signupText.textContent = 'Sign Up';
                signupSpinner.style.display = 'none';
            }
        });
    }
    
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    if (referralCode && document.getElementById('referralCode')) {
        document.getElementById('referralCode').value = referralCode;
    }
});
