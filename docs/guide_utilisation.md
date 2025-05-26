# Guide d'utilisation avancée

Ce document complète le README principal et présente plus en détail la configuration de l'environnement, les règles spécifiques du mode **KCRAP** ainsi que la gestion des sauvegardes.

## Exemples de fichier `.env`

Le serveur peut être configuré à l'aide d'un fichier `.env` placé à la racine du projet. Voici un exemple complet :

```env
# Port d'écoute du serveur HTTP
PORT=3000

# Répertoire où seront stockées les sauvegardes de partie
SAVE_PATH=./saves
```

Le dossier indiqué par `SAVE_PATH` est créé automatiquement au lancement si nécessaire. Vous pouvez modifier ces valeurs pour adapter le serveur à votre environnement (par exemple choisir un autre port ou un emplacement de sauvegarde différent).

## Règles du mode KCRAP

Le mode KCRAP introduit un paquet de cartes spéciales déclenché lorsque les joueurs tombent sur la case « KCRAP ». Ces cartes offrent des actions inédites :

- **Bourse Crypto** : fluctuation temporaire (de -30 % à +50 %) du prix de vente des propriétés du joueur.
- **Échange forcé** : échange de propriétés avec un adversaire si leurs valeurs diffèrent de moins de 20 %.
- **Restructuration** : déplacement d'une maison d'une propriété à une autre appartenant au joueur.
- **Fusion hostile** : prise de contrôle d'une propriété adverse non améliorée pour trois tours, permettant d'en percevoir les loyers.
- **Perturbation numérique** : pendant deux tours, tous les loyers perçus sont taxés à hauteur de 10 %.
- **Aller en prison** : envoie immédiatement le joueur en prison.

Ces cartes ajoutent une dimension stratégique supplémentaire et peuvent être utilisées à tout moment pendant la partie dès qu'elles sont tirées.

## Bonus de la case Départ

À chaque tour complet du plateau, un joueur reçoit **200€**. Si le déplacement l'amène exactement sur la case « Départ », le bonus est porté à **300€**.

## Sauvegarde et restauration des parties

Chaque action de jeu déclenche automatiquement une sauvegarde dans le répertoire défini par `SAVE_PATH`. Les fichiers sont nommés d'après l'identifiant de la partie et contiennent l'état complet du plateau ainsi que les informations du lobby.

Lors du démarrage du serveur, toutes les sauvegardes présentes dans ce répertoire sont chargées automatiquement. Cela permet de reprendre une partie interrompue simplement en conservant le fichier de sauvegarde et en redémarrant l'application.

Pour restaurer manuellement une partie :

1. Vérifiez que le fichier `SAVE_PATH/<id>.json` existe (où `<id>` est l'identifiant de la partie).
2. Démarrez le serveur ; la partie sera proposée dans la liste des lobbies disponibles.

Supprimer un fichier de ce dossier effacera définitivement la sauvegarde correspondante.
