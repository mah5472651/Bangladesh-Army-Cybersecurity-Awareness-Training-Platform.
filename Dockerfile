# Bangladesh Army Cybersecurity Awareness Training Platform
# Multi-stage: build SPA + run API, served via Nginx in compose

# ---- Frontend build ----
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---- Backend deps ----
FROM node:22-alpine AS backend-deps
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --omit=dev

# ---- Runtime API ----
FROM node:22-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-deps /app/server/node_modules ./server/node_modules
COPY server ./server
WORKDIR /app/server
EXPOSE 4000
CMD ["node", "src/index.js"]

# ---- Nginx static frontend ----
FROM nginx:1.27-alpine AS web
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
