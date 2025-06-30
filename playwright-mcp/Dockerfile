# FILE: playwright-mcp/Dockerfile
# Use the official Playwright MCP image (already has chromium installed)
FROM mcr.microsoft.com/playwright/mcp:latest

# Switch to root for installations
USER root

# Install additional dependencies for better support
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create screenshots directory
RUN mkdir -p /screenshots /app/browser-data/sessions && \
    chown -R 1000:1000 /screenshots /app/browser-data

# Switch back to non-root user
USER 1000

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 8831

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8831/health || exit 1

# Default environment for debugging
ENV DEBUG=pw:browser,pw:network,pw:page

# Use the official MCP entrypoint but force headless mode (fixes the --headed issue)
ENTRYPOINT ["sh", "-c", "exec node cli.js --browser chromium --host 0.0.0.0 --port ${PLAYWRIGHT_MCP_PORT:-8831} --viewport-size \"${PLAYWRIGHT_VIEWPORT_SIZE:-1280,720}\" --image-responses omit --ignore-https-errors --user-data-dir /app/browser-data/sessions --output-dir /screenshots --no-sandbox --headless"]