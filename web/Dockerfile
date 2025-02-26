# ---- Development Stage ----
FROM node:lts-alpine AS dev
WORKDIR /app/web
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
    
FROM node:lts-alpine AS prod_builder
WORKDIR /app/web
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
    
FROM nginx:alpine AS prod
WORKDIR /usr/share/nginx/html
COPY --from=prod_builder /app/web/dist .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]