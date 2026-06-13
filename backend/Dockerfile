# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Toolchain untuk build modul native (argon2)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Bawa dependency + Prisma Client yang sudah ter-generate dari builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

# Terapkan migrasi lalu jalankan API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
