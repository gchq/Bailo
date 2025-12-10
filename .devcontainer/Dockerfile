FROM node:24-bookworm

LABEL dev.containers.image.node.version="24" \
      dev.containers.image.python.version="3.11"

# Install Python 3.11 and common tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3.11 \
        python3.11-venv \
        python3.11-dev \
        python3-pip \
        python3-setuptools \
        python3-wheel \
        curl \
        git \
        bash \
        build-essential \
        sudo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Make python3.11 the default "python3"
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 \
 && update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1

# Give node user passwordless sudo
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# Install TypeScript globally
RUN npm install -g typescript

# Switch to the existing `node` user
USER node

WORKDIR /workspaces
