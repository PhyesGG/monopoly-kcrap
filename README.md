# Monopoly KCRAP

Ce projet permet de jouer à une version en ligne de Monopoly avec le mode KCRAP.

## Installation

1. Installez les dépendances :
   ```bash
   npm install
   ```

## Lancer le serveur

Pour démarrer le serveur Express avec surveillance automatique :
```bash
npm run dev
```

Pour un démarrage simple (sans nodemon) :
```bash
npm start
```

## Variables d'environnement

Le serveur peut être configuré via un fichier `.env` placé à la racine du projet.
Un exemple est fourni dans `.env.example` :

```env
PORT=3000
SAVE_PATH=./saves
```

Un script de démarrage est fourni dans `scripts/start.sh` pour lancer
l'application en production :

```bash
./scripts/start.sh
```


## Démarrer le client

Le client Webpack peut être lancé séparément :
```bash
npm run client
```

Pour lancer serveur et client simultanément :
```bash
npm run dev:all
```

## Exécuter les tests

Les tests Jest se trouvent dans le dossier `tests/` :
```bash
npm test
```

## Déploiement avec Docker

Une configuration Docker est disponible pour faciliter la mise en production.
Construisez l'image :

```bash
docker build -t monopoly-kcrap .
```

Lancez le conteneur en précisant éventuellement les variables d'environnement :

```bash
docker run -p 3000:3000 --env-file .env monopoly-kcrap
```

### Sauvegarde et reconnexion

Le serveur prend en charge la reconnexion des joueurs via l'événement `reconnect_player`.
Les chemins de sauvegarde et le port du serveur peuvent être configurés dans `server/config.js`.

Le client tente désormais automatiquement de se reconnecter lorsqu'un état joueur est
présent dans `localStorage`. Si la reconnexion réussit et qu'une partie est en cours,
l'écran de jeu est restauré.

### Persistance du pseudonyme

Le client mémorise désormais le dernier nom de joueur saisi dans `localStorage`.
Lorsque la page d'accueil est affichée, ce pseudonyme est automatiquement
prérempli dans les champs "Votre nom". Ainsi, il n'est plus nécessaire de le
renseigner à chaque nouvelle connexion.
