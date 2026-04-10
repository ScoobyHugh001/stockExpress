# --- Build stage ---
FROM --platform=linux/amd64 node:20-alpine AS build

WORKDIR /app

# Install dependencies first (leverages Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# --- Production stage ---
FROM --platform=linux/amd64 node:20-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy application source
COPY package.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY views/ ./views/

# Switch to non-root user
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/status || exit 1

CMD ["node", "src/app.js"]
