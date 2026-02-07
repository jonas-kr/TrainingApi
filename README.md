# Training API

A robust backend service for managing fitness training programs, exercises, and user progress. This API provides comprehensive authentication, data management, and notification services for a fitness-oriented application.

## 🚀 Key Features

- **Authentication & Authorization**: Secure user registration and login using JWT and Bcrypt.
- **User Management**: Profile updates and user-specific data handling.
- **Exercise Library**: CRUD operations for managing a diverse set of exercises.
- **Training Programs**: Create and manage structured workout programs.
- **Session Tracking**: Log and retrieve individual training sessions.
- **Progress Monitoring**: Track performance metrics and improvements over time.
- **Email Notifications**: Integrated email services using Nodemailer for user engagement and alerts.
- **Middleware Integration**: Custom error handling and secure route protection.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js (v5.1.0)
- **Database**: MongoDB with Mongoose
- **Security**: JSON Web Tokens (JWT), BcryptJS, Cookie-parser, CORS
- **Utilities**: Dotenv, Nodemailer, Mongoose-sequence
- **Development**: Nodemon

## ⚙️ Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB (local or Atlas instance)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd TrainingApi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add the following:
   ```env
   PORT=4000
   DB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   # Add other necessary variables (e.g., SMTP config for Nodemailer)
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `controllers/`: Logic for handling API requests.
- `models/`: Mongoose schemas and database models (User, Exercise, Program, Session, Progress).
- `routes/`: Express route definitions for different API modules.
- `middlewares/`: Custom functions for request processing (auth, error handling).
- `services/`: External services integration (e.g., email service).
- `utils/`: Helper functions and utilities.
- `server.js`: Entry point of the application.

## 📡 API Endpoints (Overview)

| Module | Route | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | Login, Register, Logout |
| **User** | `/api/user` | User profile and account management |
| **Exercise** | `/api/exercise` | Manage the exercise library |
| **Program** | `/api/program` | Workout program management |
| **Session** | `/api/session` | Log and view training sessions |
| **Progress** | `/api/progress` | Track user performance stats |

## 📜 License

This project is licensed under the ISC License.
