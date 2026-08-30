FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/package.json ./packages/config/
COPY packages/image-processing/package.json ./packages/image-processing/
COPY packages/queues/package.json ./packages/queues/
RUN npm install --workspace=@photo-platform/worker --include-workspace-root

FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/worker
CMD ["npm", "run", "dev"]
