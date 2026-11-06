FROM python:3.12-trixie@sha256:7ad6d21a25a94b2c00e685e82c2fd298de814353d9ee0e3f7f2cd4fca063df60

LABEL dev.containers.image.node.version="26" \
      dev.containers.image.python.version="3.12"

# Install core tools and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        git \
        bash \
        build-essential \
        sudo \
    && curl -fsSL https://deb.nodesource.com/setup_26.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g typescript \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create a non-root 'user' user with passwordless sudo
RUN useradd -ms /bin/bash user \
    && echo "user ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/user \
    && chmod 0440 /etc/sudoers.d/user

# Ensure python3 points to 3.12
RUN update-alternatives --install /usr/bin/python3 python3 /usr/local/bin/python3.12 1 \
 && update-alternatives --install /usr/bin/python python /usr/local/bin/python3.12 1

# Switch to 'user' user
USER user

# Workdir for devcontainer
WORKDIR /workspaces
