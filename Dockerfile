# Use Node.js 20 Alpine for smaller image size and compatibility
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Force clean install to avoid Rollup issues and ensure Node.js 20
RUN rm -rf node_modules package-lock.json && \
    npm install --no-optional --no-audit --no-fund && \
    npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
# Install bash for the build scripts
RUN apk add --no-cache bash
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for Vite environment variables (needed at build time)
ARG VITE_OKTA_CLIENT_ID
ARG VITE_OKTA_ISSUER
ARG VITE_OKTA_REDIRECT_URI

# Set Vite environment variables for the build
ENV VITE_OKTA_CLIENT_ID=$VITE_OKTA_CLIENT_ID
ENV VITE_OKTA_ISSUER=$VITE_OKTA_ISSUER
ENV VITE_OKTA_REDIRECT_URI=$VITE_OKTA_REDIRECT_URI

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_VERSION=20

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/uploads ./uploads
COPY --from=builder /app/.env* ./

# Ensure ws package is available
RUN npm list ws || npm install ws@^8.18.0

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 5001

ENV PORT=5001
ENV HOSTNAME="0.0.0.0"

# Accept build arguments for environment variables
ARG DATABASE_URL
ARG SESSION_SECRET
ARG OPENAI_API_KEY
ARG JIRA_BASE_URL
ARG JIRA_API_TOKEN
ARG JIRA_ADMIN_EMAIL
ARG VITE_OKTA_CLIENT_ID
ARG VITE_OKTA_ISSUER
ARG VITE_OKTA_REDIRECT_URI
ARG OKTA_DOMAIN
ARG OKTA_CLIENT_ID

# Set environment variables from build arguments
ENV DATABASE_URL=$DATABASE_URL
ENV SESSION_SECRET=$SESSION_SECRET
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV JIRA_BASE_URL=$JIRA_BASE_URL
ENV JIRA_API_TOKEN=$JIRA_API_TOKEN
ENV JIRA_ADMIN_EMAIL=$JIRA_ADMIN_EMAIL
ENV VITE_OKTA_CLIENT_ID=$VITE_OKTA_CLIENT_ID
ENV VITE_OKTA_ISSUER=$VITE_OKTA_ISSUER
ENV VITE_OKTA_REDIRECT_URI=$VITE_OKTA_REDIRECT_URI
ENV OKTA_DOMAIN=$OKTA_DOMAIN
ENV OKTA_CLIENT_ID=$OKTA_CLIENT_ID

# Start the application
CMD ["npm", "run", "start"] 