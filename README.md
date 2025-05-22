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

### Sauvegarde et reconnexion

Le serveur prend en charge la reconnexion des joueurs via l'événement `reconnect_player`.
Les chemins de sauvegarde et le port du serveur peuvent être configurés dans `server/config.js`.

Le client tente désormais automatiquement de se reconnecter lorsqu'un état joueur est
présent dans `localStorage`. Si la reconnexion réussit et qu'une partie est en cours,
l'écran de jeu est restauré.
