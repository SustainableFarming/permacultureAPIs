
# builder
FROM node:latest as builder
ENV DST /usr/local/optimize
RUN mkdir $DST
WORKDIR $DST
RUN mkdir lib
COPY lib/ lib/
COPY server.js server.js
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

# prod
FROM node:9.11.1-alpine as prod
ENV DST /usr/local/optimize
RUN mkdir $DST
WORKDIR $DST
RUN mkdir lib
COPY --from=builder $DST/server.js server.js
COPY --from=builder $DST/lib/ lib/
COPY --from=builder $DST/node_modules/ node_modules/
ENV PORT 80
EXPOSE 80
CMD node server.js