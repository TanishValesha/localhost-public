# localhost-public

> Make your localhost publicly accessible with custom authentication

A simple, secure CLI tool that creates public tunnels to your local development server with built-in authentication support. Perfect for sharing your work, testing webhooks, or demonstrating applications without deploying.
It is a wrapper of modern features around localtunnel package

## Features

- **Instant Public Access** - Make localhost accessible from anywhere
- **QR Generation** - QR gets generated for scanning using portable devices
- **Built-in Authentication** - Login protection with default/custom passwords
- **Multi-layer Authentication** - Custom passwords and the IP address of the network through which the tunnel was created
- **Configurable TTL** - Set custom expiry times for your tunnels
- **Beautiful CLI** - Colorful, informative command-line interface
- **Secure Sessions** - Session management with automatic expiry
- **Flexible Configuration** - Customize ports, hosts, and credentials
- **Error Handling** - Helpful error messages and troubleshooting tips

## Quick Start

### Installation

```bash
# Install globally
npm install -g localhost-public

# Or use without installing
npx localhost-public
```

### Basic Usage

```bash
# Start your local server first
npm start OR npm run dev  # or however you start your app

# Then in another terminal, create a public tunnel
localhost-public
```

That's it! Your localhost:3000 is now publicly accessible.

## Usage

### Basic Tunnel (No Authentication)

```bash
# Tunnel default port 3000
localhost-public

# Tunnel custom port
localhost-public --port 8080

# Custom expiry time
localhost-public --expiry 1h
```

### Secure Tunnel (With Authentication)

```bash
# Enable authentication (auto-generated password)
localhost-public --auth

# Custom credentials
localhost-public --auth --username myuser --password mypass

# Custom auth port
localhost-public --auth --auth-port 4000
```

## CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--port` | `-p` | Local port to tunnel | `3000` |
| `--host` | `-h` | Tunnel host service | `https://loca.lt` |
| `--expiry` | `-e` | Tunnel expiry time (s/m/h) | `24h` |
| `--auth` | | Enable authentication | `false` |
| `--username` | `-u` | Auth username | `admin` |
| `--password` | `-w` | Auth password | *auto-generated* |
| `--auth-port` | | Auth server port | *main port + 1000* |

### Time Format Examples

- `30s` - 30 seconds
- `5m` - 5 minutes  
- `2h` - 2 hours
- `24h` - 24 hours (default)

## Authentication

When authentication is enabled with `--auth`:

1. **Automatic Protection** - Users must login before accessing your app
2. **Secure Sessions** - Sessions expire automatically with the tunnel
3. **Auto-generated Passwords** - Safe passwords created if not provided (Combination of numbers and letters)
4. **Separate Auth Server** - Runs on a different port for security

### Authentication Flow

```
User visits tunnel URL → Login page (IP Address) → Login page (Custom) → Enter credentials → Access your app
```

### Example with Authentication

```bash
localhost-public --auth --port 3000 --expiry 2h
```

Output:
```
🌐 Localhost Public Tunnel
Authentication enabled
Press Ctrl+C to stop the tunnel

Creating authenticated tunnel for localhost:5173...
📱 Detected app type: react
Authentication server running on port 6173
Authenticated tunnel created successfully!
Public URL: https://odd-clocks-learn.loca.lt
Login Required: https://odd-clocks-learn.loca.lt/login
   Local URL: http://localhost:5173
   Auth Server: http://localhost:6173

Default Credentials:
   Username: admin
   Password: d5c9fc1bbb152ffc

📱 QR Code for mobile access:
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █  ▀▄▄▄▀▄ █ ▄▄▄▄▄ █
█ █   █ █ ▄▄ █▀▄█ █ █   █ █
█ █▄▄▄█ █▀▄▀▄█▀▄▄ █ █▄▄▄█ █
█▄▄▄▄▄▄▄█▄▀ █▄█ █ █▄▄▄▄▄▄▄█
█ ▄▀▀▄ ▄██▄ ▀▄█▀▀▀██▄▀ ▄ ▄█
██▄█▀ ▀▄██ ▀▄ █▄▄█▀█  ▄ ▀██
█▀▄ ██▀▄▀ ██ ▄▀▀ ▀▄▄▄▀▄▄ ▄█
███  ▄ ▄ ▄▄▄ ▀█  ▄▀█  ▄ ▀██
█▄▄███▄▄▄▀ ▀ ▄▀▀▄ ▄▄▄ ▄▄███
█ ▄▄▄▄▄ █▀█▄▄▀█▀█ █▄█ ▀▀▀██
█ █   █ █▄▄█  ▀█▀ ▄  ▄▄ █▄█
█ █▄▄▄█ █▀█▀▄▀▄█ ▄▄ ▀▀ ▀ ██
█▄▄▄▄▄▄▄█▄▄█▄▄██▄█▄▄███▄▄▄█

Testing tunnel connection...
Could not verify tunnel (but it might still work)

==================================================
AUTHENTICATION DETAILS
==================================================
Login Credentials:
   Username: admin
   Password: d5c9fc1bbb152ffc

Access Instructions:
   1. Visit: https://odd-clocks-learn.loca.lt
   2. You'll be redirected to login page
   3. Enter above credentials
   4. Access your application

Security Notes:
   • Session expires in 24h
   • Keep credentials secure
==================================================

PASSWORD WAS AUTO-GENERATED
   Save it now - it won't be shown again!
   Next time use: --password your-password


## Examples

### Development & Testing

```bash
# Quick demo for 30 minutes
localhost-public --expiry 30m

# Secure tunnel for client review
localhost-public --auth --username client --password demo123

# Webhook testing
localhost-public --port 8080 --expiry 2h
```

### Different Scenarios

```bash
# React development server
npm start &
localhost-public --port 3000

# Express API server  
node server.js &
localhost-public --port 8080 --auth

# Next.js development
npm run dev &
localhost-public --port 3000 --expiry 4h
```

## Error Handling

The tool provides helpful error messages and solutions:

### Port Conflicts
```
Error: Port 3000 is already in use
Tips:
  • Check if port 3000 is already in use
  • Try a different port: --port 3001
```

### Server Not Running
```
Error: No server detected on port 3000
Make sure your application is running:
  • Start your app on port 3000
  • Verify it's accessible at http://localhost:3000
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/TanishValesha/localhost-public.git
cd localhost-public

# Install dependencies
npm install

# Link for local testing
npm link

# Test the CLI
localhost-public --help
```

## Show Your Support

If this project helped you, please consider:

- ⭐ Starring the repository
- Sharing on social media
- Writing a review

---

## Author
Tanish Valesha

GitHub: @TanishValesha
X (Twitter): @tanish_valesha
LinkedIn: Tanish Valesha
