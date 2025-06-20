#!/usr/bin/env node

const { Command } = require("commander");
const LocalhostPublic = require("../index");
const chalk = require("chalk");
const crypto = require("crypto");

const program = new Command();

program
  .name("localhost-public")
  .description(
    "Make your localhost publicly accessible with optional authentication"
  )
  .version("1.0.0");

program
  .option("-p, --port <number>", "local port to tunnel", "3000")
  .option("-h, --host <string>", "tunnel host service", "https://loca.lt")
  .option(
    "-e, --expiry <string>",
    "time to live for the tunnel (s: seconds, m: minutes, h: hours)",
    "24h"
  )
  .option(
    "--auth",
    "enable authentication (requires login before accessing tunnel)"
  )
  .option(
    "-u, --username <string>",
    "username for authentication (default: admin)"
  )
  .option(
    "-w, --password <string>",
    "password for authentication (auto-generated if not provided)"
  )
  .option(
    "--auth-port <number>",
    "port for authentication server (default: original port + 1000)"
  )
  .option("--no-auth", "disable authentication (default behavior)")
  .option("--m, --multihost", "two local ports to create a two tunnels")
  .action(async (options) => {
    const port = parseInt(options.port);

    // Validate port
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error(
        chalk.red("Invalid port number. Please provide a port between 1-65535")
      );
      process.exit(1);
    }

    // Validate TTL
    if (!/^\d+[smh]$/.test(options.ttl) && options.ttl !== "24h") {
      console.error(
        chalk.red(
          "Invalid TTL format. Please use a format like '10s', '5m', '1h', or '24h'."
        )
      );
      process.exit(1);
    }

    // Validate auth port if provided
    let authPort = options.authPort ? parseInt(options.authPort) : port + 1000;
    if (
      options.authPort &&
      (isNaN(authPort) || authPort < 1 || authPort > 65535)
    ) {
      console.error(
        chalk.red(
          "Invalid auth port number. Please provide a port between 1-65535"
        )
      );
      process.exit(1);
    }

    // Check for port conflicts
    if (options.auth && authPort === port) {
      console.error(
        chalk.red(
          "Auth port cannot be the same as the main port. Please choose a different auth port."
        )
      );
      process.exit(1);
    }

    console.log(chalk.blue.bold("🌐 Localhost Public Tunnel"));

    if (options.auth) {
      console.log(chalk.yellow("Authentication enabled"));
    } else {
      console.log(chalk.gray("No authentication (public access)"));
    }

    console.log(chalk.gray("Press Ctrl+C to stop the tunnel\n"));

    // Setup tunnel configuration
    const tunnelConfig = {
      port,
      host: options.host,
      ttl: options.ttl,
    };

    // Configure authentication if enabled
    if (options.auth) {
      tunnelConfig.authPort = authPort;

      // Set username (default to 'admin' if not provided)
      const username = options.username || "admin";

      // Generate password if not provided
      let password = options.password;
      if (!password) {
        password = crypto.randomBytes(8).toString("hex");
      }

      tunnelConfig.credentials = {
        username,
        password,
      };

      // Generate a secure session secret
      tunnelConfig.sessionSecret = crypto.randomBytes(32).toString("hex");
    }

    const tunnel = new LocalhostPublic(tunnelConfig);

    try {
      const url = await tunnel.start();

      // Display additional info for authenticated tunnels
      if (options.auth) {
        console.log(chalk.blue("\n" + "=".repeat(50)));
        console.log(chalk.blue.bold("AUTHENTICATION DETAILS"));
        console.log(chalk.blue("=".repeat(50)));
        console.log(chalk.yellow("Login Credentials:"));
        console.log(
          chalk.white(
            `   Username: ${chalk.cyan.bold(tunnelConfig.credentials.username)}`
          )
        );
        console.log(
          chalk.white(
            `   Password: ${chalk.cyan.bold(tunnelConfig.credentials.password)}`
          )
        );
        console.log(chalk.yellow("\nAccess Instructions:"));
        console.log(chalk.white(`   1. Visit: ${chalk.cyan(url)}`));
        console.log(chalk.white("   2. You'll be redirected to login page"));
        console.log(chalk.white("   3. Enter credentials above"));
        console.log(chalk.white("   4. Access your application"));
        console.log(chalk.yellow("\nSecurity Notes:"));
        console.log(chalk.gray("   • Session expires in 24 hours"));
        console.log(chalk.gray("   • Use /logout to end session"));
        console.log(chalk.gray("   • Keep credentials secure"));
        console.log(chalk.blue("=".repeat(50) + "\n"));

        if (!options.password) {
          console.log(chalk.yellow.bold("PASSWORD WAS AUTO-GENERATED"));
          console.log(
            chalk.yellow("   Save it now - it won't be shown again!")
          );
          console.log(
            chalk.gray("   Next time use: --password your-password\n")
          );
        }
      }

      // Keep the process running
      process.stdin.resume();
    } catch (error) {
      console.error(chalk.red("Failed to start tunnel:"), error.message);

      // Provide helpful error messages
      if (error.message.includes("EADDRINUSE")) {
        console.log(chalk.yellow("\nTips to fix port conflicts:"));
        console.log(chalk.gray(`   • Check if port ${port} is already in use`));
        console.log(
          chalk.gray(`   • Try a different port: --port ${port + 1}`)
        );
        if (options.auth) {
          console.log(
            chalk.gray(
              `   • Try different auth port: --auth-port ${authPort + 1}`
            )
          );
        }
      } else if (error.message.includes("No server detected")) {
        console.log(chalk.yellow("\nMake sure your application is running:"));
        console.log(chalk.gray(`   • Start your app on port ${port}`));
        console.log(
          chalk.gray("   • Verify it's accessible at http://localhost:" + port)
        );
      }

      process.exit(1);
    }
  });

// Add help examples
program.on("--help", () => {
  console.log("");
  console.log(chalk.blue.bold("Examples:"));
  console.log("");
  console.log(chalk.gray("  # Basic tunnel (no auth)"));
  console.log("  $ localhost-public");
  console.log("");
  console.log(chalk.gray("  # Custom port"));
  console.log("  $ localhost-public --port 8080");
  console.log("");
  console.log(chalk.gray("  # With authentication"));
  console.log("  $ localhost-public --auth");
  console.log("");
  console.log(chalk.gray("  # Custom credentials"));
  console.log(
    "  $ localhost-public --auth --username myuser --password mypass"
  );
  console.log("");
  console.log(chalk.gray("  # Short TTL with auth"));
  console.log("  $ localhost-public --auth --ttl 30m");
  console.log("");
  console.log(chalk.blue.bold("Authentication:"));
  console.log("");
  console.log(chalk.white("  When --auth is enabled:"));
  console.log(chalk.gray("  • Users must login before accessing your app"));
  console.log(chalk.gray("  • Sessions are secure and expire automatically"));
  console.log(chalk.gray("  • Password is auto-generated if not provided"));
  console.log(chalk.gray("  • Auth server runs on port + 1000 by default"));
  console.log("");
});

// Handle unknown commands
program.on("command:*", function (operands) {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.log(chalk.gray("Use --help to see available commands"));
  process.exit(1);
});

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);
