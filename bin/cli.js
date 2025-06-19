#!/usr/bin/env node

const { Command } = require("commander");
const LocalhostPublic = require("../index");
const chalk = require("chalk");

const program = new Command();

program
  .name("localhost-public")
  .description("Make your localhost:3000 publicly accessible")
  .version("1.0.0");

program
  .option("-p, --port <number>", "local port to tunnel", "3000")
  .option("-h, --host <string>", "tunnel host service", "https://loca.lt")
  .option(
    "-t, --ttl <string>",
    "time to live for the tunnel (s: seconds, m: minutes, h: hours)",
    "24h"
  )
  .action(async (options) => {
    const port = parseInt(options.port);

    if (isNaN(port) || port < 1 || port > 65535) {
      console.error(
        chalk.red(
          "❌ Invalid port number. Please provide a port between 1-65535"
        )
      );
      process.exit(1);
    }

    if (!/^\d+[smh]$/.test(options.ttl)) {
      console.error(
        chalk.red(
          "❌ Invalid TTL format. Please use a format like '10s', '5m', or '1h'."
        )
      );
      process.exit(1);
    }

    console.log(chalk.blue.bold("🌐 Localhost Public Tunnel"));
    console.log(chalk.gray("Press Ctrl+C to stop the tunnel\n"));

    const tunnel = new LocalhostPublic({
      port,
      host: options.host,
      ttl: options.ttl,
    });

    try {
      await tunnel.start();

      // Keep the process running
      process.stdin.resume();
    } catch (error) {
      console.error(chalk.red("❌ Failed to start tunnel:"), error.message);
      process.exit(1);
    }
  });

// Handle unknown commands
program.on("command:*", function (operands) {
  console.error(chalk.red(`❌ Unknown command: ${operands[0]}`));
  console.log(chalk.gray("Use --help to see available commands"));
  process.exit(1);
});

program.parse(process.argv);
