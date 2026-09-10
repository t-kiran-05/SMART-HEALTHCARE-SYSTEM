

## 🏥 Smart Healthcare System

A microservices-based healthcare appointment booking platform featuring role-based access for patients and doctors, real-time notifications, and secure authentication.

**System Architecture:**

* **Frontend:** Next.js (Port `3000`)
* **Auth Service:** Node.js/Express (Port `3001`)
* **Appointment Service:** Node.js/Express (Port `3002`)
* **Notification Service:** Node.js/Express (Port `3003`)

---

## ⚙️ Prerequisites & Installation

**1. Required Software**

* **Node.js (Strictly v20.x):** This project requires Node 20 (e.g., v20.11.0). Do not use Node 22. Verify with `node -v`.
* **MongoDB Atlas:** A free M0 cluster account for database hosting.

**2. Install Dependencies**
Navigate to each service directory in your terminal and run `npm install`:

```bash
# Backend Services
cd backend/auth-service && npm install
cd ../appointment-service && npm install
cd ../notification-service && npm install

# Frontend Application
cd ../../frontend && npm install

```

---

## 🚀 Environment Setup & Running

**1. Database Configuration**
Create a database user in MongoDB Atlas and allow IP access (`0.0.0.0/0`). Copy your connection string and add `/healthcare` before the query parameters.

**2. Environment Variables**
Create a `.env` file in **all three backend directories** (`auth-service`, `appointment-service`, `notification-service`) with the following structure:

```env
PORT=3001 # (Use 3002 for Appointment, 3003 for Notification)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/healthcare?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:3000

```

*Note: Create a `.env.local` in the `frontend` directory if your frontend requires specific API URL routing.*

**3. Start the Application**
Open four separate terminal windows. In each window, navigate to one of the directories and start the development server:

```bash
npm run dev

```

Wait for the "Connected to MongoDB Atlas" confirmation in all backend terminals, and the "Ready" prompt in the Next.js frontend terminal.

---

## 🧪 Usage Workflow & Troubleshooting

**Testing the Flow:**

1. Navigate to `http://localhost:3000`.
2. Register a new user with the **Patient** role.
3. Register a new user with the **Doctor** role (requires logging out first).
4. Log back in as the Patient, select the Doctor, and submit an appointment request.
5. Log in as the Doctor to view, approve, or reject the pending appointment.

**Common Issues:**

* **Authentication Failed:** Your MongoDB password in the `.env` file is incorrect. Ensure special characters are properly URL-encoded.
* **CORS Policy Error:** Ensure `FRONTEND_URL=http://localhost:3000` is correctly set in all backend `.env` files and restart the servers.
* **Cannot Connect to Server:** Verify that all four terminal instances are running simultaneously without crashing.

---
