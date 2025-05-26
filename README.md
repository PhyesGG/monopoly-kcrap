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
Copiez le fichier d'exemple `.env.example` sous le nom `.env` puis ajustez les valeurs :

```env
PORT=3000
SAVE_PATH=./saves
```

* `PORT` : port d'écoute du serveur HTTP.
* `SAVE_PATH` : répertoire où seront stockées les sauvegardes de partie (créé automatiquement au démarrage).

Ce fichier est chargé automatiquement par le serveur. Lors d'un déploiement Docker,
vous pouvez passer ces valeurs avec `--env-file .env`.

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

### Liens directs vers les salons

Il est possible d'accéder directement à un salon via l'URL `http://<hôte>:<port>/ID_SALON`.
Au chargement, le client détecte cet identifiant et tente de rejoindre
automatiquement le salon avec le pseudonyme enregistré ou préremplit le champ
"Code du salon".
Dans l'écran du lobby, le code d'invitation apparaît comme un lien menant à
`/ID_SALON` afin de pouvoir le partager facilement.

### Résumé du mode KCRAP

Le mode KCRAP ajoute plusieurs mécaniques innovantes :

* **Enchères modernes** : chaque propriété libre fait l'objet d'une enchère démarrant à 50 % de son prix et dont le montant décroît si personne n'enchérit.
* **Alliances temporaires** : deux joueurs peuvent s'allier pour trois tours et se partager 50 % des loyers, avec une pénalité de 200 € en cas de rupture unilatérale.
* **Jeton de revanche** : en cas de quasi-faillite, un joueur peut recevoir 500 € et doit rembourser 750 € sous cinq tours.

Lorsqu'un joueur s'arrête sur la case « KCRAP », il pioche en outre une carte spéciale pouvant déclencher l'un des effets suivants :

* **Bourse Crypto** : fluctuation temporaire du prix de vente de ses propriétés.
* **Échange forcé** : échange de propriétés avec un adversaire si leurs valeurs sont proches.
* **Restructuration** : déplacement d'une maison d'une propriété du joueur vers une autre.
* **Fusion hostile** : prise de contrôle temporaire d'une propriété adverse non améliorée.
* **Perturbation numérique** : taxation de 10 % des loyers pendant deux tours.
* **Aller en prison** : le joueur est immédiatement envoyé en prison.

Ces cartes et ces mécaniques renforcent l'aspect stratégique du jeu. Consultez [docs/guide_utilisation.md](docs/guide_utilisation.md) pour la description complète de chaque règle.

## Guide d'utilisation avancée

Consultez [docs/guide_utilisation.md](docs/guide_utilisation.md) pour un guide détaillé incluant des exemples de configuration, les règles du mode KCRAP et la procédure de sauvegarde/restauration.
