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

# Keep container running
CMD ["sleep", "infinity"]
