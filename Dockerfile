FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production && npm cache clean --force
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/providers ./providers
COPY --chown=node:node server.js ./
USER node
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "server.js"]
