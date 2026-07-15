@echo off
echo 🚀 Launching FireX Tournament ERP System...

echo Starting Fastify Backend on Port 5000...
start cmd /k "cd backend && npm run dev"

echo Starting Vite React Frontend...
start cmd /k "cd frontend && npm run dev"

echo Done! Both servers are initializing in separate console windows.
