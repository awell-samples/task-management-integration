FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production

COPY . .

RUN yarn build

ENV PORT=3000

EXPOSE $PORT

CMD ["yarn", "start"]
