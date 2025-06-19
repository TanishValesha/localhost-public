const localtunnel = require("localtunnel");
const chalk = require("chalk");
const qrcode = require("qrcode-terminal");
const axios = require("axios");

class LocalhostPublic {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.ttl = options.ttl || "24h";
    this.host = options.host || "https://loca.lt";
    this.tunnel = null;
  }

  async checkServerHealth() {
    try {
      const response = await axios.get(`http://localhost:${this.port}`, {
        timeout: 5000,
        validateStatus: () => true, // Accept any status code
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

      // Check for Next.js
      if (
        body.includes("__NEXT_DATA__") ||
        body.includes("_next/") ||
        response.headers["x-powered-by"]?.includes("Next.js")
      ) {
        return "nextjs";
      }

      // Check for React (Create React App)
      if (body.includes("react") || body.includes("React")) {
        return "react";
      }

      // Check for large SPAs
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

  async startWithLocaltunnel() {
    const tunnelOptions = {
      port: this.port,
      host: this.host,
      local_host: "localhost",
    };

    if (this.subdomain) {
      tunnelOptions.subdomain = this.subdomain;
    }

    this.tunnel = await localtunnel(tunnelOptions);

    // Handle tunnel events
    this.tunnel.on("close", () => {
      console.log(chalk.red("🔴 Tunnel closed"));
    });

    this.tunnel.on("error", (err) => {
      console.error(chalk.red("❌ Tunnel error:"), err.message);
    });

    return this.tunnel.url;
  }

  calculateTTL() {
    const length = this.ttl.length;
    if (this.ttl[length - 1] === "s") {
      this.ttl = parseInt(this.ttl.slice(0, length - 1)) * 1000;
    } else if (this.ttl[length - 1] === "m") {
      this.ttl = parseInt(this.ttl.slice(0, length - 1)) * 60000;
    } else if (this.ttl[length - 1] === "h") {
      this.ttl = parseInt(this.ttl.slice(0, length - 1)) * 3600000;
    } else if (this.ttl === "24h") {
      this.ttl = 86400000;
    } else {
      throw new Error(
        "Invalid TTL format. Please use a format like '10s', '5m', or '1h'."
      );
    }
    const ttlInMs = this.ttl === "24h" ? 86400000 : this.ttl;
    return ttlInMs;
  }

  async start() {
    try {
      console.log(
        chalk.blue(`🚀 Creating tunnel for localhost:${this.port}...`)
      );

      // Check if server is running
      const isServerRunning = await this.checkServerHealth();
      if (!isServerRunning) {
        throw new Error(
          `No server detected on localhost:${this.port}. Please make sure your application is running.`
        );
      }

      // Detect application type
      const appType = await this.detectAppType();
      console.log(chalk.gray(`📱 Detected app type: ${appType}`));

      // Create tunnel with localtunnel
      const url = await this.startWithLocaltunnel();

      console.log(chalk.green("✅ Tunnel created successfully!"));
      console.log(chalk.yellow("📡 Public URL:"), chalk.cyan.bold(url));
      console.log(
        chalk.gray("   Local URL:"),
        chalk.gray(`http://localhost:${this.port}`)
      );

      // Performance tips for different app types
      if (appType === "nextjs") {
        console.log(
          chalk.blue(
            "💡 Next.js detected: For best performance, consider using production mode"
          )
        );
        console.log(chalk.gray("   Try: npm run build && npm start"));
      } else if (appType === "spa") {
        console.log(
          chalk.blue(
            "💡 Large app detected: Consider enabling gzip compression"
          )
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
            chalk.red("❌ Server is not responding. Please check your app.")
          );
          this.stop();
        }
      }, 10000);

      const ttlTimeout = setTimeout(() => {
        console.log(chalk.yellow("🕒 Tunnel has expired. Stopping..."));
        clearInterval(healthCheckInterval);
        this.stop();
      }, this.calculateTTL());

      // Handle process termination
      process.on("SIGINT", () => {
        this.stop();
      });

      process.on("SIGTERM", () => {
        this.stop();
      });

      return url;
    } catch (error) {
      console.error(chalk.red("❌ Failed to create tunnel:"), error.message);
      throw error;
    }
  }

  async testTunnel(url) {
    try {
      console.log(chalk.gray("🧪 Testing tunnel connection..."));
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status === 200) {
        console.log(chalk.green("✅ Tunnel is working correctly"));
      } else {
        console.log(
          chalk.yellow(`⚠️ Tunnel responding with status: ${response.status}`)
        );
      }
    } catch (error) {
      console.log(
        chalk.yellow("⚠️ Could not verify tunnel (but it might still work)")
      );
    }
  }

  stop() {
    console.log(chalk.yellow("🛑 Closing tunnel..."));
    if (this.tunnel) {
      this.tunnel.close();
      this.tunnel = null;
      console.log(chalk.green("✅ Tunnel closed"));
    }

    process.exit(0);
  }

  getUrl() {
    return this.tunnel ? this.tunnel.url : null;
  }
}

module.exports = LocalhostPublic;
