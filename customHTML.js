function customLoginTunnel() {
  const customHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>My Custom Login</title>
        <style>
            body { 
                background: #f0f0f0; 
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            .login-box {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body>
        <div class="login-box">
            <h2>🎯 My App Access</h2>
            <form id="loginForm" method="POST" action="/auth/login">
                <input type="password" name="password" placeholder="Enter access code" required>
                <button type="submit">Enter</button>
            </form>
        </div>
        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.querySelector('input[name="password"]').value;
                
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    alert('Wrong access code!');
                }
            });
        </script>
    </body>
    </html>
  `;
}
