const localtunnel = require("localtunnel");
const chalk = require("chalk");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const express = require("express");
const session = require("express-session");
const httpProxy = require("http-proxy-middleware");
const crypto = require("crypto");

class LocalhostPublic {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.authPort = options.authPort || this.port + 1000; // Authentication server port
    this.expiry = options.expiry || "24h";
    this.host = options.host || "https://loca.lt";
    this.tunnel = null;
    this.authServer = null;
    this.credentials = options.credentials || {
      username: "admin",
      password: crypto.randomBytes(16),
    };
    this.sessionSecret = options.sessionSecret || "spartan";
    this.visitors = 0;
    this.visitors_list = [];
  }

  setupAuthServer() {
    const app = express();

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(
      session({
        secret: this.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      })
    );

    // Login page HTML
    const loginPageHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Required</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .login-container {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                width: 100%;
                max-width: 400px;
            }
            .login-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            .login-header h1 {
                color: #333;
                margin: 0;
                font-size: 1.8rem;
            }
            .login-header p {
                color: #666;
                margin: 0.5rem 0 0 0;
            }
            .form-group {
                margin-bottom: 1rem;
            }
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #333;
                font-weight: 500;
            }
            .form-group input {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #ddd;
                border-radius: 5px;
                font-size: 1rem;
                transition: border-color 0.3s;
                box-sizing: border-box;
            }
            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }
            .login-btn {
                width: 100%;
                padding: 0.75rem;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            .login-btn:hover {
                background: #5a6fd8;
            }
            .error {
                color: #e74c3c;
                text-align: center;
                margin-top: 1rem;
                padding: 0.5rem;
                background: #fdf2f2;
                border-radius: 5px;
                border: 1px solid #fecaca;
            }
            .tunnel-info {
                text-align: center;
                margin-top: 1.5rem;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 5px;
                border-left: 4px solid #667eea;
            }
            .tunnel-info h3 {
                margin: 0 0 0.5rem 0;
                color: #333;
            }
            .tunnel-info p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="login-header">
                <h1>🔐 Secure Access</h1>
                <p>Please login to access the tunneled application</p>
            </div>
            
            <form method="POST" action="/login">
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="login-btn">Login</button>
            </form>
            
            {{ERROR_MESSAGE}}
            
            <div class="tunnel-info">
                <h3>Localhost Tunnel</h3>
                <p>Securely accessing localhost:{{PORT}}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Authentication middleware
    const requireAuth = (req, res, next) => {
      if (req.session && req.session.authenticated) {
        return next();
      } else {
        return res.redirect("/login");
      }
    };

    // Login route
    app.get("/login", (req, res) => {
      const html = loginPageHTML
        .replace("{{ERROR_MESSAGE}}", "")
        .replace("{{PORT}}", this.port);
      res.send(html);
    });

    // Login POST route
    app.post("/login", (req, res) => {
      const fingerprint = `${req.ip}-${req.headers["user-agent"]}`;
      if (!this.visitors_list.includes(fingerprint)) {
        this.visitors++;
        this.visitors_list.push(fingerprint);
        console.log("Unique Visitor Count: ", this.visitors);
      }
      const { username, password } = req.body;

      if (
        username === this.credentials.username &&
        password === this.credentials.password
      ) {
        req.session.authenticated = true;
        req.session.username = username;
        res.redirect("/");
      } else {
        const html = loginPageHTML
          .replace(
            "{{ERROR_MESSAGE}}",
            '<div class="error">Invalid username or password</div>'
          )
          .replace("{{PORT}}", this.port);
        res.send(html);
      }
    });

    // Proxy all other requests to the original app (with auth)
    app.use(
      "/",
      requireAuth,
      httpProxy.createProxyMiddleware({
        target: `http://localhost:${this.port}`,
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
        onError: (err, req, res) => {
          console.error(chalk.red("Proxy error:"), err.message);
          res.status(502).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 2rem;">
              <h1>Service Unavailable</h1>
              <p>The application on localhost:${this.port} is not responding.</p>
              <p>Please make sure your application is running.</p>
            </body>
          </html>
        `);
        },
      })
    );

    return app;
  }

  async checkServerHealth() {
    try {
      const response = await axios.get(`http://localhost:${this.port}`, {
        timeout: 5000,
        validateStatus: () => true,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async detectAppType() {
    try {
      const response = await axios.get(`http://localhost:${this.port}`, {
        timeout: 3000,
        validateStatus: () => true,
      });

      const contentType = response.headers["content-type"] || "";
      const body = typeof response.data === "string" ? response.data : "";

      if (
        body.includes("__NEXT_DATA__") ||
        body.includes("_next/") ||
        response.headers["x-powered-by"]?.includes("Next.js")
      ) {
        return "nextjs";
      }

      if (body.includes("react") || body.includes("React")) {
        return "react";
      }

      if (
        body.length > 50000 ||
        (contentType.includes("text/html") && body.includes("script"))
      ) {
        return "spa";
      }

      return "simple";
    } catch (error) {
      return "unknown";
    }
  }

  async startAuthServer() {
    return new Promise((resolve, reject) => {
      const app = this.setupAuthServer();

      this.authServer = app.listen(this.authPort, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(
            chalk.blue(`Authentication server running on port ${this.authPort}`)
          );
          resolve();
        }
      });
    });
  }

  async startWithLocaltunnel() {
    const tunnelOptions = {
      port: this.authPort, // Tunnel the auth server instead of the original app
      host: this.host,
      local_host: "localhost",
    };

    if (this.subdomain) {
      tunnelOptions.subdomain = this.subdomain;
    }

    this.tunnel = await localtunnel(tunnelOptions);

    this.tunnel.on("close", () => {
      console.log(chalk.red("Tunnel closed"));
    });

    this.tunnel.on("error", (err) => {
      console.error(chalk.red("Tunnel error:"), err.message);
    });

    return this.tunnel.url;
  }

  calculateExpiry() {
    const length = this.expiry.length;
    if (this.expiry[length - 1] === "s") {
      this.expiry = parseInt(this.expiry.slice(0, length - 1)) * 1000;
    } else if (this.expiry[length - 1] === "m") {
      this.expiry = parseInt(this.expiry.slice(0, length - 1)) * 60000;
    } else if (this.expiry[length - 1] === "h") {
      this.expiry = parseInt(this.expiry.slice(0, length - 1)) * 3600000;
    } else if (this.expiry === "24h") {
      this.expiry = 86400000;
    } else {
      throw new Error(
        "Invalid expiry format. Please use a format like '10s', '5m', or '1h'."
      );
    }
    const expiryInMs = this.expiry === "24h" ? 86400000 : this.expiry;
    return expiryInMs;
  }

  async start() {
    try {
      console.log(
        chalk.blue(
          `Creating authenticated tunnel for localhost:${this.port}...`
        )
      );

      // Check if original server is running
      const isServerRunning = await this.checkServerHealth();
      if (!isServerRunning) {
        throw new Error(
          `No server detected on localhost:${this.port}. Please make sure your application is running.`
        );
      }

      // Detect application type
      const appType = await this.detectAppType();
      console.log(chalk.gray(`📱 Detected app type: ${appType}`));

      // Start authentication server
      await this.startAuthServer();

      // Create tunnel with localtunnel (pointing to auth server)
      const url = await this.startWithLocaltunnel();

      console.log(chalk.green("Authenticated tunnel created successfully!"));
      console.log(chalk.yellow("Public URL:"), chalk.cyan.bold(url));
      console.log(chalk.yellow("Login Required:"), chalk.cyan(`${url}/login`));
      console.log(
        chalk.gray("   Local URL:"),
        chalk.gray(`http://localhost:${this.port}`)
      );
      console.log(
        chalk.gray("   Auth Server:"),
        chalk.gray(`http://localhost:${this.authPort}`)
      );

      console.log(chalk.blue("\nDefault Credentials:"));
      console.log(chalk.gray(`   Username: ${this.credentials.username}`));
      console.log(chalk.gray(`   Password: ${this.credentials.password}`));

      // Performance tips
      if (appType === "nextjs") {
        console.log(
          chalk.blue(
            "Next.js detected: For best performance, consider using production mode"
          )
        );
        console.log(chalk.gray("   Try: npm run build && npm start"));
      } else if (appType === "spa") {
        console.log(
          chalk.blue("Large app detected: Consider enabling gzip compression")
        );
      }

      // Generate QR code for easy mobile access
      console.log(chalk.yellow("\n📱 QR Code for mobile access:"));
      qrcode.generate(url, { small: true });

      // Test the tunnel
      await this.testTunnel(url);

      const healthCheckInterval = setInterval(async () => {
        const isHealthy = await this.checkServerHealth();
        if (!isHealthy) {
          console.error(
            chalk.red(
              "Original server is not responding. Please check your app."
            )
          );
          this.stop();
        }
      }, 10000);

      const expiryTimeout = setTimeout(() => {
        console.log(chalk.yellow("Tunnel has expired. Stopping..."));
        clearInterval(healthCheckInterval);
        this.stop();
      }, this.calculateExpiry());

      // Handle process termination
      process.on("SIGINT", () => {
        this.stop();
      });

      process.on("SIGTERM", () => {
        this.stop();
      });

      return url;
    } catch (error) {
      console.error(chalk.red("Failed to create tunnel:"), error.message);
      throw error;
    }
  }

  async testTunnel(url) {
    try {
      console.log(chalk.gray("Testing tunnel connection..."));
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status === 200 || response.status === 302) {
        console.log(chalk.green("Tunnel is working correctly"));
      } else {
        console.log(
          chalk.yellow(`Tunnel responding with status: ${response.status}`)
        );
      }
    } catch (error) {
      console.log(
        chalk.yellow("Could not verify tunnel (but it might still work)")
      );
    }
  }

  stop() {
    console.log(chalk.yellow("Closing tunnel and auth server..."));

    if (this.tunnel) {
      this.tunnel.close();
      this.tunnel = null;
    }

    if (this.authServer) {
      this.authServer.close();
      this.authServer = null;
    }

    console.log(chalk.green("Tunnel and auth server closed"));
    process.exit(0);
  }

  getUrl() {
    return this.tunnel ? this.tunnel.url : null;
  }

  // Method to update credentials
  setCredentials(username, password) {
    this.credentials = { username, password };
  }
}

module.exports = LocalhostPublic;
