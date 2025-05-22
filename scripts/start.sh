#!/bin/sh
# Script de démarrage pour la production

# Charger les variables d'environnement depuis .env si présent
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Construire le client si nécessaire
npm run build

# Lancer le serveur
npm start
