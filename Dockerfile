FROM node:20-alpine as builder
WORKDIR /app
COPY . .
# Install backend dependencies
RUN cd backend && npm install --production
# Install and build frontend
RUN cd frontend && npm install && npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist
WORKDIR /app/backend
EXPOSE 5000
CMD ["node", "server.js"]
