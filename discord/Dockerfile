FROM node:12-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN mkdir -p ./content/articles
RUN touch ./content/articles/index.txt

USER node

COPY --from=mwader/static-ffmpeg:4.2.3 /ffmpeg /ffprobe /usr/local/bin/

RUN npm install

COPY --chown=node:node . .
RUN mkdir -p ../.aws/
COPY ./config/.aws/* ../.aws/

CMD [ "node", "discord/index.js" ]
