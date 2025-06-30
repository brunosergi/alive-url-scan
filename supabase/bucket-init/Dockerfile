# FILE: supabase/bucket-init/Dockerfile
FROM node:18-alpine

# Install necessary packages
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Initialize npm and install Supabase SDK
RUN npm init -y && npm install @supabase/supabase-js

# Copy configuration script
COPY configure-bucket.js .

# Make sure script is executable
RUN chmod +x configure-bucket.js

# Default command
CMD ["node", "configure-bucket.js"]