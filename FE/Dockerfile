# Stage 1: Build Frontend with Node.js
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=https://api-gpt-images.nexoratech.com.vn/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
