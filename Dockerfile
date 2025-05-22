FROM node:18-alpine

# Créer le dossier de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev

# Copier le reste du code
COPY . .

# Construire le client pour la production
RUN npm run build

# Exposer le port utilisé par l'application
ENV PORT=3000
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
