ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

# Install latest npm
RUN npm install -g npm@latest

# Install additional tools
RUN apk add --no-cache \
    git \
    curl \
    bash \
    python3 \
    make \
    g++

# Configure npm
RUN npm config set update-notifier false

# Set working directory
WORKDIR /workspace

# Create directories and set ownership to node user
RUN mkdir -p /workspace/node_modules \
    /workspace/packages/auth-sdk/node_modules \
    /workspace/packages/auth-sdk/dist && \
    chown -R node:node /workspace

# Switch to node user for all subsequent operations
USER node

# Keep container running
CMD ["sleep", "infinity"]
