Contacts Management API (Backend)

This repository contains the backend API for the Contacts Management application.
It is built with Node.js and Express, uses JWT authentication, and stores data in a SQLite database.

The API allows users to securely manage their own contacts with full CRUD functionality and strict user isolation.

✨ Features

User registration

User login with JWT authentication

Secure password hashing

Create, read, update, and delete contacts

User-scoped data access (users can only manage their own contacts)

SQLite database (file-based, no external DB required)

🧱 Project Structure
contacts-api-backend/
├── middleware/
│   └── auth.js        # JWT authentication middleware
├── db.js              # SQLite database setup
├── server.js          # Express server & routes
├── data.sqlite        # SQLite database file (auto-generated)
├── .env.example       # Example environment variables
├── package.json
├── package-lock.json
└── README.md

🛠 Tech Stack

Node.js

Express

SQLite

JSON Web Tokens (JWT)

bcrypt (password hashing)

dotenv (environment variables)

cors

📋 Prerequisites

Node.js (v18+ recommended)

npm

⚙️ Environment Variables

Create a .env file in the root of the backend project.

Example (.env.example):

PORT=3000
JWT_SECRET=your_strong_secret_here


Copy and edit:

cp .env.example .env


⚠️ Never commit .env files to GitHub.

🚀 Setup & Run
1️⃣ Install dependencies
cd contacts-api-backend
npm install

2️⃣ Start the server
node server.js


Server will start on:

http://localhost:3000


Health check:

http://localhost:3000/


Expected response:

Contacts API running ✅

🔐 Authentication

Users authenticate using JWT tokens

Tokens are returned on successful login

Protected routes require:

Authorization: Bearer <token>

📡 API Endpoints
Public Endpoints
Register

POST /auth/register

{
  "email": "user@example.com",
  "password": "password123"
}

Login

POST /auth/login

{
  "email": "user@example.com",
  "password": "password123"
}


Response:

{
  "token": "<jwt_token>"
}

Protected Endpoints (JWT required)
List contacts

GET /contacts

Create contact

POST /contacts

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "123456"
}

Get contact by ID

GET /contacts/:id

Update contact

PUT /contacts/:id

{
  "name": "Jane Updated",
  "email": "jane.updated@example.com",
  "phone": "999999"
}

Delete contact

DELETE /contacts/:id

Response:

{
  "message": "Contact deleted"
}

🧪 Testing

You can test all endpoints using:

Postman

curl

Frontend application (separate repository)

Example:

curl http://localhost:3000/contacts \
  -H "Authorization: Bearer <token>"

🔒 Security Notes

Passwords are hashed using bcrypt

JWT secret is stored in environment variables

All contact queries are scoped by user_id

Unauthorized access returns appropriate HTTP errors

🗄 Database

Uses SQLite (data.sqlite)

Database file is auto-generated on first run

Tables:

users

contacts

No manual migrations required.

👩‍💻 Author

Mariam Barseghyan
