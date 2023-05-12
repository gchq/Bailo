FROM node:16-alpine as installer

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

RUN mkdir /s2i && \
    wget -O s2i.tar.gz https://github.com/openshift/source-to-image/releases/download/v1.3.1/source-to-image-v1.3.1-a5a77147-linux-amd64.tar.gz && \
    tar -xvf s2i.tar.gz -C /s2i && \
    rm -rf s2i.tar.gz

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:16-alpine as runner

RUN apk add --no-cache libc6-compat img docker
RUN apk update

WORKDIR /app

ARG user_id=1001
RUN chmod u+s /usr/bin/newuidmap /usr/bin/newgidmap \
    && adduser -D -u $user_id builder \
    && mkdir -p /run/user/$user_id \
    && chown -R builder /run/user/$user_id /home/builder \
    && addgroup -S certs \
    && addgroup builder certs \
    && chgrp certs /etc/ssl/certs \
    && chmod 775 /etc/ssl/certs \
    && mkdir -p /usr/local/share/ca-certificates \
    && chgrp certs /usr/local/share/ca-certificates \
    && chmod 775 /usr/local/share/ca-certificates \
    && echo builder:100000:65536 | tee /etc/subuid | tee /etc/subgid

COPY --from=installer /s2i /s2i
RUN chmod -R o+x /s2i

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=installer /app/config config
COPY --from=installer /app/dist .

USER $user_id

ENV NODE_ENV production
ENV XDG_RUNTIME_DIR=/run/user/$user_id
ENV HOME /home/builder
ENV USER builder

EXPOSE 3001

CMD ["node", "src/index.js"]