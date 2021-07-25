FROM node:16

WORKDIR /usr/src/app

COPY package*.json  ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=prod

CMD ["npm", "start"]