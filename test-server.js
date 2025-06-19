const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Server</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 50px;
        }
        .container {
          background: rgba(255,255,255,0.1);
          padding: 40px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        p { font-size: 1.2em; }
        .time { 
          font-size: 2em; 
          color: #ffeb3b; 
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 localhost-public Test Server</h1>
        <p>Your tunnel is working perfectly!</p>
        <p>Server running on port ${process.env.PORT || 3000}</p>
        <div class="time" id="time"></div>
        <p style="margin-top: 30px;">
          <strong>Request URL:</strong> ${req.url}<br>
          <strong>User Agent:</strong> ${req.headers["user-agent"]}<br>
          <strong>Time:</strong> ${new Date().toISOString()}
        </p>
      </div>
      <script>
        function updateTime() {
          document.getElementById('time').textContent = new Date().toLocaleTimeString();
        }
        updateTime();
        setInterval(updateTime, 1000);
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌟 Test server running on http://localhost:${PORT}`);
  console.log("Ready to test with localhost-public!");
});
