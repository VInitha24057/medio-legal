FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p uploads/cases uploads/reports

EXPOSE 5000

CMD ["npm", "start"]
