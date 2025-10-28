
# 🦷 Dentist Appointment Voice + Web Assistant

An AI-powered appointment management system that automates patient communication, scheduling, confirmation, and clinic dashboard management.

Built using **FastAPI**, **React**, **MCP Tools**, **Vapi Voice Agent**, and **MySQL**, this system enables automated voice booking, WhatsApp confirmations, and an interactive admin panel.

---

## 🧠 Project Overview

The system allows:
- Patients to **book appointments by talking** to an AI voice agent (phone call)
- Automatic **dentist slot search** and assignment
- **WhatsApp appointment confirmations**
- Admins to **view bookings, cancellations & analytics** via dashboard
- Secure **JWT login authentication** for Admin Panel

---

## ⚙️ Tech Stack

| Layer | Technology Used |
|------|----------------|
| Voice Agent | Vapi Voice AI |
| Backend API | FastAPI (Bridge Server) |
| Business Logic | MCP Tools Server |
| Database | MySQL |
| Frontend | React + Vite + TailwindCSS |
| Authentication | JWT Tokens |
| Messaging | WhatsApp Go Bridge Service |
| Environment Management | Python Dotenv |

---

## 🏗️ Architecture Overview

```
                      (Patient Calls)
                  ┌───────────────────────┐
                  │     Vapi Voice Bot    │
                  │  (Collects details)   │
                  └──────────┬────────────┘
                             │ JSON Payloads
                  ┌──────────▼────────────┐
                  │  FastAPI Bridge API   │
                  │  (Routing + Auth)     │
                  └──────────┬────────────┘
                             │
               ┌─────────────┴───────────────┐
               │         MCP Tool Server      │
               │ (Availability + Booking + DB)│
               └─────────────┬───────────────┘
                             │ SQL Queries
                       ┌─────▼───────┐
                       │  MySQL DB   │
                       │ patients,   │
                       │ dentists,   │
                       │ appointments│
                       └─────────────┘

        ┌────────────────────────────┐
        │  React Admin Dashboard     │
        │  (Stats / Charts / Login)  │
        └─────────────┬──────────────┘
                      │ REST API
```

---

## 🧩 Folder Structure

```
Dentist-Appointment-System/
│
├── backend/
│   ├── dentist_bridge_server.py     # FastAPI API Gateway
│   ├── dentist_mcp_server.py        # MCP Tools + DB Handler
│   ├── requirements.txt
│   ├── .env
│   └── venv/
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── .env
```

---

## 🔑 Environment Variables

### Backend `.env`
```
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=dentist_appointments
```

### Frontend `.env`
```
VITE_VAPI_CLIENT_KEY=your_vapi_client_key
VITE_VAPI_AGENT_ID=your_vapi_agent_id
```

---

## ⚙️ Backend Setup

```
cd backend
python -m venv venv
venv/Scripts/activate  # Windows
pip install -r requirements.txt

# Start MCP Server
python dentist_mcp_server.py

# Start Bridge Server
python dentist_bridge_server.py
```

---

## 💻 Frontend Setup

```
cd frontend
npm install
npm run dev
```
Open: **http://localhost:5173/**

---

## 🧠 System Workflow

| Action | Responsible Component | Description |
|--------|------------------------|-------------|
| Patient speaks by phone | **Vapi Voice Agent** | Collects patient name, date, reason |
| Slot lookup + dentist assignment | **MCP Tool Server** | Finds dentist availability & books appointment |
| Confirmation message | **FastAPI + WhatsApp Bridge** | Sends WhatsApp message to patient |
| Dashboard management | **React Dashboard** | Admin views appointments & analytics |

---

## 🛡 Security Features

- JWT login protection for Admin panel
- Secure DB access methods
- Protected API routes
- Env-based credential isolation

---

## 🚀 Deployment Notes

| Component | Suggested Hosting |
|---------|------------------|
| Backend | Railway / Render / AWS EC2 |
| Frontend | Netlify / Vercel |
| Database | AWS RDS / PlanetScale |
| Voice Agent | Vapi Cloud |
| WhatsApp Bridge | Local Go Server / VPS |

---

## ✅ Project Status: Production Ready
This system supports real clinics with daily patient handling.

