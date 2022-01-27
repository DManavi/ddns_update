FROM node:16-alpine3.14 as build_image

WORKDIR /app

COPY src src/
COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci && \
  npm run build

FROM node:16-alpine3.14

WORKDIR /app

COPY --from=build_image /app/dist dist/
COPY package*.json ./

RUN npm install --only=production

CMD ["node", "./dist/index.js"]