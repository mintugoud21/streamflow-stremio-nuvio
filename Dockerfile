FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 7000

ENV PORT=7000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["npm", "start"]
