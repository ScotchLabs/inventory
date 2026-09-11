FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache certbot certbot-nginx openssl bash

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /startup.sh
COPY renew-certs.sh /renew-certs.sh
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chmod +x /startup.sh /renew-certs.sh

EXPOSE 80 443

ENTRYPOINT []
CMD ["/bin/bash", "/startup.sh"]