# --- Stage 1: Build ---
FROM node:24.12.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json*  ./

RUN npm ci

COPY . .

RUN npm run build

# --- Stage 2: Run ---
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]