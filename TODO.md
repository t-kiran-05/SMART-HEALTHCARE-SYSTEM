# CORS Configuration Update Task

## Completed Tasks
- [x] Update CORS in backend/auth-service/server.js
- [x] Update CORS in backend/appointment-service/server.js
- [x] Update CORS in backend/notification-service/server.js

## Summary
All backend services have been updated with the extended CORS configuration including:
- origin: process.env.FRONTEND_URL || 'http://localhost:3000'
- credentials: true
- methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
- allowedHeaders: ['Content-Type', 'Authorization']
- exposedHeaders: ['Set-Cookie']
- preflightContinue: false
- optionsSuccessStatus: 204
