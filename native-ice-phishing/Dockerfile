# Build stage: compile Typescript to Javascript
FROM node:18-alpine3.17 AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
RUN npm install -g javascript-obfuscator
RUN javascript-obfuscator --split-strings true ./dist/key.js --output ./obfuscated

# Final stage: copy compiled Javascript from previous stage and install production dependencies
FROM node:18-alpine3.17
ENV NODE_ENV=production
# Uncomment the following line to enable agent logging
LABEL "network.forta.settings.agent-logs.enable"="true"
WORKDIR /app
COPY --from=builder /app/dist ./src
COPY --from=builder /app/obfuscated ./src
COPY package*.json ./
COPY ./LICENSE ./
RUN npm ci --production
CMD [ "npm", "run", "start:prod" ]