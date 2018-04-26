
# builder
FROM node:latest as builder
RUN npm install -g typescript
ENV DST /usr/local/tshello
RUN mkdir $DST
WORKDIR $DST
RUN mkdir lib
COPY server.ts server.ts
COPY lib/*.ts lib/
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
RUN npm install
RUN tsc

# prod
FROM node:9.11.1-alpine as prod
ENV DST /usr/local/tshello
RUN mkdir $DST
WORKDIR $DST
RUN mkdir lib
COPY --from=builder $DST/server.js server.js
COPY --from=builder $DST/lib/*.js lib/
COPY --from=builder $DST/node_modules/ node_modules/
ENV PORT 80
EXPOSE 80
CMD node server.js