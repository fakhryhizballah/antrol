# Dockerfile for running index.js every minute
# Dockerfile for running index.js every minute
# Use official Node LTS base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application
COPY . .
COPY .env .env

# Install cron
RUN apk add --no-cache busybox-suid
RUN echo "*/1 * * * * /usr/local/bin/node /app/index.js >> /var/log/cron.log 2>&1" | crontab -

# Ensure cron starts on container startup
CMD ["crond", "-f", "-L", "/var/log/cron.log"]
