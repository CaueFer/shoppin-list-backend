FROM node:21.7.3

WORKDIR .

COPY package*.json .

RUN npm install

COPY . . 

EXPOSE 3001

CMD ["sh", "-c", "npx prisma generate && npm start"]


