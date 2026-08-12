# 📋 Logi Factu 3LM - Backend

> Backend API for the Logi Factu 3LM invoice and client management system.

---

## 🖥️ How to Open This Project on Your PC



1. Open the project in  **VS Code**
2. In terminal do:
   cd backend


⚙️ Environment Setup
Create a .env file in the root of the backend folder:

env
DATABASE_URL="postgresql://postgres:yourlocalhostpassword@localhost:5432/3LMdb?schema=public"
JWT_SECRET="your_secret_key_here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your_refresh_secret_here"
JWT_REFRESH_EXPIRES_IN="7d"
REFRESH_TOKEN_DAYS=7


📦 Installation
npm install

Database Setup
npx prisma migrate dev
npx prisma generate


🚀 Running the Application
npm run start:dev



📝 Swagger API Documentation
Open in your browser:

text
http://localhost:3001/api/docs






🔧 Technologies
NestJS

Prisma

PostgreSQL

JWT

Swagger

