# Build stage
FROM node:20-alpine AS builder
WORKDIR .
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# # Runtime stage
FROM node:20-alpine
WORKDIR .
RUN npm install -g serve
COPY --from=builder ./dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]