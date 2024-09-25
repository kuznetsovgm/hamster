FROM node:20-alpine as build
WORKDIR /opt/app
ADD *.json ./
RUN npm ci --legacy-peer-deps
ADD . .
RUN npm run build

FROM node:20-alpine
WORKDIR /opt/app
ADD *.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY --from=build /opt/app/dist ./dist
CMD ["node", "./dist/main.js"]
EXPOSE 3000/tcp