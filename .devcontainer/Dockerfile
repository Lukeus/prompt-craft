# Use the official Node.js 18 image as base
FROM node:18-bullseye

# Install additional system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    curl \
    wget \
    unzip \
    vim \
    nano \
    postgresql-client \
    build-essential \
    python3 \
    python3-pip \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install global npm packages for development
RUN npm install -g \
    typescript \
    ts-node \
    nodemon \
    npm-check-updates \
    @astrojs/cli \
    drizzle-kit \
    concurrently

# Create a non-root user
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Ensure the node user exists with the right UID/GID
RUN if [ "$USER_UID" != "1000" ] || [ "$USER_GID" != "1000" ]; then \
    groupmod --gid $USER_GID node \
    && usermod --uid $USER_UID --gid $USER_GID node \
    && chown -R $USER_UID:$USER_GID /home/node; \
    fi

# Set up workspace directory
WORKDIR /workspaces
RUN chown -R node:node /workspaces

# Switch to non-root user
USER node

# Set up shell environment
RUN echo 'export PS1="\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "' >> ~/.bashrc
RUN echo 'alias ll="ls -alF"' >> ~/.bashrc
RUN echo 'alias la="ls -A"' >> ~/.bashrc
RUN echo 'alias l="ls -CF"' >> ~/.bashrc

# Default command
CMD ["sleep", "infinity"]