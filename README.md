# Logi Factu 3LM - Backend

Backend API for the Logi Factu 3LM invoice and client management system.

## 🖥️ How to Open This Project on Your PC

### Method 1: Using VS Code

1. Open **VS Code**

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

# Run Prisma migrations

npx prisma migrate dev

# Generate Prisma client

npx prisma generate

🚀 Running the Application

# Development mode (with hot reload)

npm run start:dev

# Production mode

npm run start:prod

# Swagger to visualize endpoints:

Use this url in browser:http://localhost:3001/api/docs
