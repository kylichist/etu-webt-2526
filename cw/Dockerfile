FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY index.html .
COPY css css
COPY img img
COPY js js
COPY data data
COPY sound sound

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
