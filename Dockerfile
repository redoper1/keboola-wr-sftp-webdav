FROM node:8.16.0
MAINTAINER Radek Tomasek <radek.tomasek@gmail.com>

WORKDIR /tmp

RUN git clone https://github.com/radektomasek/keboola-wr-sftp-webdav ./ && npm install

ENTRYPOINT node ./src/index.js --data=/data
