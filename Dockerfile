FROM node:alpine

EXPOSE 3000

COPY . /app

WORKDIR /app

RUN yarn

CMD yarn start
