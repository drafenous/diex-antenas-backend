FROM node:22-alpine AS builder

RUN apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    vips-dev \
    git \
    python3

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV STRAPI_TELEMETRY_DISABLED=true

RUN npm run build

# Remove dependências usadas somente no build
RUN npm prune --omit=dev


FROM node:22-alpine AS runner

RUN apk add --no-cache vips-dev

WORKDIR /app

ENV NODE_ENV=production
ENV STRAPI_TELEMETRY_DISABLED=true

COPY --from=builder /app ./

RUN chown -R node:node /app

USER node

EXPOSE 8080

CMD ["npm", "run", "start"]