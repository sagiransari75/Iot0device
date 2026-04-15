# IotSimX — Web-Based IoT Simulator

> **Academic Year 2026** · Web-Based Raspberry Pi & Sensor IoT Simulator

A fully interactive, browser-based IoT simulator built with **React / Next.js** and **Node.js**. Visualize Raspberry Pi GPIO connections, drag-and-drop sensor circuits, generate live sensor data, and learn IoT concepts — **without any hardware**.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **React Flow Circuit Builder** | Drag-and-drop GPIO circuit editor — connect RPi pins to sensors visually |
| **GPIO Visualizer** | Interactive Raspberry Pi 40-pin header with live HIGH/LOW state |
| **Sensor Simulation** | DHT11 (Temp), PIR (Motion), LDR (Light) with configurable ranges |
| **Live Dashboard** | Real-time Chart.js graphs updating via Socket.IO |
| **Admin Panel** | Simulation speed control, pause/resume, reset, JSON export, alert log |
| **Sensor Config** | Per-sensor enable/disable, min/max ranges, sensitivity sliders |
| **Auth System** | Login / Signup with demo account, JWT-style token, avatar in Navbar |
| **Alert Thresholds** | Auto-alerts when sensor values exceed configured limits |
| **Day/Night Mode** | Persistent light/dark theme toggle |
| **Custom Cursor** | Animated cursor dot + trailing glow ring |

---

## 🗂️ Project Structure

```
IOT/
├── server.js                  # Entry: delegates to backend/
├── package.json               # Backend dependencies
├── start.bat                  # One-click launcher (Windows)
├── README.md
│
├── backend/                   # Node.js REST + Socket.IO server
│   ├── index.js               # Express app + Socket.IO setup
│   ├── state.js               # Shared in-memory state
│   ├── simulation.js          # Sensor data generation engine
│   └── routes/
│       ├── authRoutes.js      # POST /api/auth/login|signup|logout
│       ├── sensorRoutes.js    # GET/POST /api/sensors + GPIO
│       ├── adminRoutes.js     # GET/POST /api/admin/*
│       └── dashboardRoutes.js # GET /api/dashboard
│
└── frontend/                  # Next.js 16+ React application
    └── src/
        ├── app/
        │   ├── layout.js      # Root layout (Navbar + Footer + Auth)
        │   ├── globals.css    # Design system (dark theme, tokens)
        │   ├── page.js        # Home page
        │   ├── login/         # Login page
        │   ├── signup/        # Signup page
        │   ├── simulator/     # React Flow circuit builder IDE
        │   ├── dashboard/     # Live Chart.js dashboard
        │   ├── sensors/       # Sensor configuration panels
        │   ├── admin/         # Admin control panel
        │   └── not-found.js   # 404 page
        ├── components/
        │   ├── Navbar.jsx     # Auth-aware navbar + theme toggle
        │   ├── Footer.jsx     # Footer
        │   └── CursorEffect.jsx  # Animated cursor
        └── context/
            └── AuthContext.jsx   # Login/logout/user state
```

---

## ⚙️ Setup & Run

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- npm

### Option 1 — One-Click (Windows)
```
Double-click start.bat
```
This installs all dependencies and starts both servers.

### Option 2 — Manual

**Terminal 1 — Backend**
```bash
npm install
node server.js
# Runs on http://localhost:4000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

Then open: **http://localhost:3000**

**Demo account:** `demo@iotsimx.dev` / `demo1234`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Log in, returns token |
| GET | `/api/auth/me` | Verify token + get user |
| POST | `/api/auth/logout` | Invalidate token |
| GET | `/api/sensors` | Get all sensor configs + history |
| POST | `/api/sensors` | Update sensor config |
| GET | `/api/sensors/history` | History only (for chart seeding) |
| GET | `/api/gpio` | Get GPIO pin states |
| GET | `/api/dashboard` | Dashboard snapshot (latest + history) |
| POST | `/api/simulate` | Trigger one manual tick |
| GET | `/api/admin/status` | Full system status |
| POST | `/api/admin/toggle` | Pause / Resume simulation |
| POST | `/api/admin/speed` | Set speed: slow / normal / fast |
| POST | `/api/admin/reset` | Reset all to defaults |
| GET | `/api/admin/log` | Event log (paginated) |
| GET | `/api/admin/alerts` | Alert-level logs only |
| GET | `/api/admin/export` | Full JSON export snapshot |
| GET | `/api/health` | Health check |

### Socket.IO Events
- **`sensorData`** — Emitted every tick with `{ data, gpio, log }`
- **`manualTick`** — Client can emit to trigger a manual tick

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js, Socket.IO |
| Frontend | Next.js 16, React 19, App Router |
| Circuit | @xyflow/react (React Flow) — drag & drop |
| Charts | Chart.js + react-chartjs-2 |
| Real-time | Socket.IO (WebSockets) |
| Auth | In-memory store, SHA-256 hashed passwords |
| Fonts | Syne, Space Grotesk, JetBrains Mono |

---

## 🎓 Academic Info

- **Project:** IotSimX — Web-Based IoT Simulator
- **Stack:** Next.js + Node.js + React Flow + Socket.IO
- **Academic Year:** 2026
- **Purpose:** Virtual learning platform for Raspberry Pi GPIO & IoT sensor education

---

## 📄 License

Academic project — for educational purposes only.
