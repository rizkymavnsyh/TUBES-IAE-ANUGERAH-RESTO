FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Force rebuild to pick up latest code changes
EXPOSE 4002

CMD ["npm", "start"]
