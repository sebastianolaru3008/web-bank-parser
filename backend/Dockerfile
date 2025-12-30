FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY src ./src
COPY data ./data

ENV PORT=8080
EXPOSE 8080

CMD ["npm","run","dev"]
