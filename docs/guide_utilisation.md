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

Le mode KCRAP ajoute plusieurs mécaniques inédites qui viennent compléter les règles classiques :

### 1. Système d'enchères modernes

* Lorsqu'un joueur arrive sur une propriété libre, une enchère automatique débute.
* La mise de départ correspond à **50 %** du prix de la case.
* Tous les joueurs peuvent participer et enchérir tour à tour ou passer leur tour.
* S'il n'y a aucune enchère, le prix baisse de **10 %** à chaque manche.
* Après cinq manches sans enchère, la propriété reste à la banque.

### 2. Système d'alliances temporaires

* Deux joueurs peuvent s'allier pour **trois tours chacun** au maximum.
* Pendant une alliance, les loyers perçus sont partagés à **50 %** entre les deux alliés.
* Une seule alliance peut être active par joueur.
* Rompre une alliance de manière unilatérale entraîne une pénalité de **200 €** versée à l'ex‑allié.

### 3. Mécanisme de revanche

* Chaque joueur dispose d'un **jeton « Revanche »** utilisable une fois par partie.
* S'il ne peut pas payer un loyer ou une taxe, il peut activer ce jeton pour recevoir immédiatement **500 €**.
* Le prêt doit être remboursé à hauteur de **750 €** dans les cinq tours suivants, faute de quoi toutes ses propriétés retournent à la banque.

### 4. Cartes KCRAP

Lorsqu'un joueur s'arrête sur la case « KCRAP », il pioche une carte parmi les effets suivants :

* **Bourse Crypto** : fluctuation temporaire (de ‑30 % à +50 %) du prix de vente de ses propriétés.
* **Échange forcé** : échange de propriétés avec un adversaire si leurs valeurs diffèrent de moins de 20 %.
* **Restructuration** : déplacement d'une maison d'une propriété vers une autre appartenant au joueur.
* **Fusion hostile** : prise de contrôle temporaire d'une propriété adverse non améliorée pour trois tours.
* **Perturbation numérique** : pendant deux tours, tous les loyers perçus sont taxés à hauteur de 10 %.
* **Aller en prison** : le joueur est immédiatement envoyé en prison.

Ces cartes apportent une dimension stratégique supplémentaire et s'utilisent dès qu'elles sont tirées.

## Sauvegarde et restauration des parties

Chaque action de jeu déclenche automatiquement une sauvegarde dans le répertoire défini par `SAVE_PATH`. Les fichiers sont nommés d'après l'identifiant de la partie et contiennent l'état complet du plateau ainsi que les informations du lobby.

Lors du démarrage du serveur, toutes les sauvegardes présentes dans ce répertoire sont chargées automatiquement. Cela permet de reprendre une partie interrompue simplement en conservant le fichier de sauvegarde et en redémarrant l'application.

Pour restaurer manuellement une partie :

1. Vérifiez que le fichier `SAVE_PATH/<id>.json` existe (où `<id>` est l'identifiant de la partie).
2. Démarrez le serveur ; la partie sera proposée dans la liste des lobbies disponibles.

Supprimer un fichier de ce dossier effacera définitivement la sauvegarde correspondante.
