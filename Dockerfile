FROM node:19-alpine as base

WORKDIR /build

COPY package.json yarn.lock ./
RUN yarn install

COPY ./ .
RUN yarn build

# ------------------------------------------------------------------------

FROM node:19-alpine

RUN apk add --no-cache --no-progress tini

ARG DIR=/home/node/app
ARG PORT=3333

ENV DIR $DIR
ENV PORT $PORT
ENV PROTECT_ROUTES false
ENV RESTORE_SESSIONS_ON_START_UP true
ENV DATABASE_ENABLED true
ENV DATABASE_KIND localfs
ENV LOCALFS_PATH $DIR/fs

USER node
WORKDIR $DIR

COPY --from=base "/build/lib" .
COPY --from=base "/build/node_modules" "./node_modules"
RUN mkdir -p "$DIR/fs"

EXPOSE $PORT
VOLUME ["$DIR/fs"]
ENTRYPOINT ["/sbin/tini", "--", "node", "server.js"]
