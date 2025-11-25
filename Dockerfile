FROM --platform=$BUILDPLATFORM node:20-bullseye-slim as builder

WORKDIR /home/frontend

RUN npm install -g @angular/cli@18

COPY package.json package-lock.json ./
# Supprimer package-lock.json s'il y a des conflits et réinstaller les dépendances
RUN rm -f package-lock.json && npm install

COPY . /home/frontend/
