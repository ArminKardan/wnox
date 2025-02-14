FROM docker.arvancloud.ir/node:23-alpine AS base

FROM base AS deps

RUN apk add --no-cache libc6-compat

COPY . /apps/wmailer

COPY ./linux /apps/

WORKDIR /apps/wmailer

CMD ["yarn", "ts-node", "--transpileOnly", "run.ts"]