FROM node:19-alpine as base

WORKDIR /build

COPY package.json yarn.lock ./
RUN yarn install

COPY ./ .
RUN yarn build

# ------------------------------------------------------------------------

FROM node:19-alpine

USER root
RUN apk add --no-cache --no-progress tini
USER node

ARG DIR=/home/node/app
ENV DIR $DIR
WORKDIR $DIR

COPY --from=base "/build/lib" .
COPY --from=base "/build/node_modules" "./node_modules"

RUN mkdir -p "$DIR/fs"

USER root
RUN chown node:node $DIR
USER node

ARG PORT=3333

ENV PORT $PORT
ENV PROTECT_ROUTES false
ENV RESTORE_SESSIONS_ON_START_UP true
ENV DATABASE_ENABLED true
ENV DATABASE_KIND localfs
ENV LOCALFS_PATH $DIR/fs

EXPOSE $PORT
VOLUME ["$DIR/fs"]
ENTRYPOINT ["/sbin/tini", "--", "node", "server.js"]
