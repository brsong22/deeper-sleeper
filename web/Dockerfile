FROM node:lts-alpine
WORKDIR /app/web
COPY ./web/package*.json .
RUN npm install
COPY ./web .
EXPOSE 3000
CMD ["npm", "run", "dev"]