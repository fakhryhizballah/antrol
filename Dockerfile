FROM node:latest

# Set working directory
WORKDIR /app

# Copy source
COPY . .

# Install dependencies
RUN npm install

# Install cron
RUN apt-get update && apt-get install -y cron && rm -rf /var/lib/apt/lists/*

# Add cron job
RUN echo "*/1 * * * * /usr/local/bin/node /app/index.js >> /var/log/cron.log 2>&1" > /etc/cron.d/myjob \
    && chmod 0644 /etc/cron.d/myjob

# Start cron in the foreground
CMD ["cron", "-f"]
