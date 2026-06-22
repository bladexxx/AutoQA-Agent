# 🌐 AI-Powered Web QA Automation Agent (agent-browser Powered)

This is a professional, containerized-ready Full-stack Web QA Automation Application which executes natural/traditional scripts on any target web application using Gemini AI and a physical headless Chromium execution layer.

Inspired by **vercel-labs/agent-browser**, this system bridges high-fidelity LLM reasoning with a reliable sandbox running Puppeteer.

---

## 🚀 Key Features & Hybrid Architecture

The application operates on a robust **Double-Engine Architecture** for testing web applications:

```
                  ┌────────────────────────────────────────┐
                  │          QA Automation Portal          │
                  │ (React Web Console + Express Backend) │
                  └───────────────────┬────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
            ┌─────────────────────────┐ ┌─────────────────────────┐
            │   Real Browser Engine   │ │  AI Simulator Fallback  │
            │   (Headless Chromium)   │ │  (Structured Sandbox)   │
            └────────────┬────────────┘ └─────────────────────────┘
                         │
                         ▼
            ┌─────────────────────────┐
            │   Gemini Self-Healing   │
            │     (Visual/DOM)        │
            └─────────────────────────┘
```

### 1. 🏎️ Real Puppeteer Execution Engine (Default)
When a test gets executed, the system spins up a headless **Chromium** sandbox directly inside the Node server host environment and processes the script using real browser drivers:
*   **Action support**: Runs real mouse clicks (`agent.click(selector)`), keyboard inputs (`agent.type(selector, text)`), static waits (`agent.wait(ms)`), and page assertions (`agent.assert(selectorOrText)`).
*   **Self-Healing AI Engine**: If an element's selector changes, becomes hidden, or fails to load, **Gemini AI** intercepts the error, parses the active DOM tree structure, and heals the script on-the-fly dynamically (mapping alternative nodes or recommending selectors). It seamlessly prevents brittle tests from breaking!

### 2. 🪄 AI High-Fidelity Simulation Engine (Demo Fallback)
For sandboxed mock demonstrations or sandbox routing (or when running without local Chromium bindings in low-provision environments), the script routes to the high-fidelity AI Simulator. The simulator constructs a natural simulation step-by-step with real-time log outputs designed to match **vercel-labs/agent-browser** specifications.

### 3. 📬 Message-Queue Queue Orchestration
A clustered **RabbitMQ Broker** setup handles background orchestration of concurrent test flows and schedules test results storage under a persistent QA database storage (`qa_database.json`).

---

## 📦 Docker Local Deployment & Remote Access

Inside the project root, a dedicated `Dockerfile` and `docker-compose.yml` are fully configured to compile, package, and launch the service out-of-the-box.

### 1. Default Docker Compose Launch
Run the following command at the root directory to spin up the web app, RabbitMQ nodes, and persistent volumes:

```bash
docker-compose up -d --build
```

This brings up:
1.  **QA Application Portal** (`qa_automation_agent_web`) on [http://localhost:3000](http://localhost:3000)
2.  **RabbitMQ Management Portal** (`rabbitmq`) on [http://localhost:15672](http://localhost:15672) (User: `admin` / Password: `admin_secret` by default)

To tear down the stack and keep database volumes intact:
```bash
docker-compose down
```

---

### 2. Modifying the Running Port
By default, the application runs on port **`3000`**. If you have port conflicts (e.g. your local port `3000` is already in use by another app) or want to host it under a different port, you can customize it dynamically using the `APP_PORT` environment variable:

```bash
# Start on Port 8080 instead:
APP_PORT=8080 docker-compose up -d
```

Alternatively, you could permanently set it in an `.env` file next to your `docker-compose.yml`:
```env
# .env file content
APP_PORT=8080
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### 3. Enabling Remote Connections & Remote Access
To host this QA platform on a cloud server/external host and access it from remote machines, evaluate these three system requirements:

1.  **0.0.0.0 Bindings (Network Interfaces)**:
    *   The containerized Express server inside Docker binds dynamically to `0.0.0.0` (all interfaces) rather than only `localhost`/`127.0.0.1`.
    *   This ensures that any incoming external browser request reaching your host network will route successfully directly into the container.
2.  **Firewall Allowance**:
    *   Ensure your server, cloud service provider security group, or host system firewall (like `ufw`, `firewalld`, or AWS Security Groups) allows incoming connections on your chosen port.
    *   To allow traffic on port `3000` or custom `8080` via Linux UFW:
        ```bash
        sudo ufw allow 3000/tcp
        # Or if remapped:
        sudo ufw allow 8080/tcp
        ```
3.  **Cross-Origin Headers**:
    *   The Express backend features complete CORS handling, ensuring that team browser connections made from remote IP addresses are not blocked by standard CORS blocks.

---

## 🛠️ Local Development & Manual Startup

If you wish to run the applet directly on your host machine without Docker:

### 1. Prerequisites
Ensure you have **Node.js 18+** and a running **RabbitMQ** instance on your machine (or disable rabbitmq connectivity inside development `server.ts` fallback).

### 2. Install Project Dependencies
Run the package manager from the project root:
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file at the root of your project:
```env
# Essential AI Reasoning credentials
GEMINI_API_KEY=your-gemini-v1-api-key

# Optional Customizations (if using local Chromium binaries)
CHROME_PATH=/usr/bin/chromium
```

### 4. Direct Launch Commands
*   **Run Development Server (Express + Vite Proxy)**:
    ```bash
    npm run dev
    ```
*   **Format and Check Types**:
    ```bash
    npm run lint
    ```
*   **Compile Server & Production Assets**:
    ```bash
    npm run build
    ```
*   **Run Compiled Release Build**:
    ```bash
    npm run start
    ```

---

## 📁 File Structure Overview

Here is a quick map of the central directories in this workspace:

| Path | Description |
|---|---|
| 📄 `server.ts` | **Express server entrypoint** which manages RabbitMQ cluster message channels, orchestrates execution threads, hosts Chromium/Puppeteer drivers, and triggers AI Self-Healing logic. |
| 📄 `docker-compose.yml` | Stack composition configuration containing standard remapping configurations and RabbitMQ worker queue instances. |
| 📄 `Dockerfile` | Multi-stage build setup which bundles static React assets, installs required Linux packages (Chromium, nss, fontconfig), and configures production runtimes. |
| 📁 `src/App.tsx` | Interactive UI panel displaying telemetry dashboards, live browser logs, real-time Chromium console logs, script builders, and target endpoints. |
| 📄 `qa_database.json` | Local persistent storage tracking automation historical records, error screenshots, execution paths, and metrics. |

---

## 📃 Supported Script Commands

Your test scripts write directly in standard JS/TS format. The execution loop compiles this using these APIs:

| Command API | Action | Description |
|---|---|---|
| `agent.goto(url)` | Navigation | Connects the active test tab safely with target web app layout DOM. |
| `agent.click(selector)` | Click Simulation | Focuses and clicks on active DOM element or dynamically runs AI-healing elements. |
| `agent.type(selector, value)` | Input | Mimics real human keyboard key presses inside text inputs or textareas. |
| `agent.wait(ms)` | Delay Hold | Temporarily halts automated thread progression for standard state loading pauses. |
| `agent.assert(selectorOrText)` | Assertion Check | Evaluates if the DOM body contains specified string or custom CSS locator nodes. |

---

*This system was built with 💙 for premium visual representation, seamless modern orchestration, and AI-driven robust self-healing mechanics!*
