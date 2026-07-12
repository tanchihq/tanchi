# SweeLeads, le moteur

> Le coeur du produit : comment on source, comment on renseigne, et comment on apprend de ce qui convertit vraiment. C'est ici que se joue la différence avec les autres outils de prospection IA.

Ce document décrit trois briques : le **sourcing et le renseignement**, les **agents**, et l'**apprentissage**. Elles se bouclent entre elles, c'est ça toute l'histoire.

---

## 1. Sourcing et renseignement

Deux étapes distinctes qu'on confond souvent : trouver les leads, puis les connaître. La deuxième est celle qui fait la conversion.

### 1.1 Sourcing

Chaque soir, un job identifie de nouveaux leads sur la base des ICP configurés. Les ICP servent de seeds : on part de profils types et on cherche des profils similaires à travers les sources pertinentes par canal.

Le sourcing produit une liste brute. Il ne juge pas encore, il ratisse. La qualification vient après.

### 1.2 Renseignement

C'est un **pipeline de vérification**, pas une génération. La qualité vient de la rigueur des sources, jamais du modèle. C'est le point le plus important du produit.

**Règles dures, non négociables :**

- Chaque fait du dossier est cité et sourcé.
- Jamais un nom, un logo ou un client qui n'apparaît pas sur le site ou le LinkedIn du prospect lui-même.
- `web_fetch` du site réel prime toujours sur `web_search`.
- Une donnée non vérifiée n'entre pas dans le dossier. Pas de "probablement", pas d'inférence non sourcée.

**Le pipeline dossier :**

1. Collecte multi-source : site, LinkedIn, presse récente, event en cours, levée de fonds, recrutements, stack technique.
2. Extraction structurée, chaque fait attaché à sa source.
3. Synthèse en un dossier lisible.
4. Proposition de 3 à 5 accroches candidates, classées, chacune rattachée à un fait vérifié.

**Sortie :** un dossier prospect où chaque accroche répond à "pourquoi ce prospect, maintenant, avec cet angle".

### 1.3 Le pont vers l'apprentissage

Le renseignement produit des **types d'accroche** (event récent, levée, recrutement, connexion commune, preuve sociale locale). Ces types sont l'unité sur laquelle l'apprentissage mesure. Le renseignement n'alimente pas juste la rédaction, il alimente la boucle d'apprentissage. Les deux se bouclent.

---

## 2. Les agents

Quatre étapes, pas quatre cerveaux. En interne c'est un pipeline séquentiel plus un job async. Côté présentation, on peut les nommer comme quatre agents.

### Chasseur, sourcing

Ratisse les leads sur les ICP, chaque soir. Sort une liste brute de candidats.

### Profiler, renseignement et qualification

Le plus important. Pour chaque lead : lance le pipeline de renseignement vérifié, qualifie (A / B / C), score, choisit le canal le plus pertinent, produit le dossier sourcé avec ses accroches candidates. Chaque soir.

### Copywriter, rédaction

Rédige le message. Nourri de trois choses : le dossier du Profiler, le playbook distillé de l'ICP, et les few-shots des accroches gagnantes passées pour ce type de prospect. Chaque soir.

### Analyste, apprentissage

Ne tourne pas dans le cycle du soir. Job async, basse fréquence (hebdo). Il distille ce qui a converti et réécrit le playbook. C'est lui qui fait progresser tout le système.

**La couche stratégie n'est pas un agent.** ICP, ton, canaux : figés au setup, réinjectés partout. Pas un cerveau qui tourne toutes les nuits.

```
      SETUP (stratégie figée : ICP, ton, canaux)
                    |
   SOIR  ┌──────────┴──────────┐
         Chasseur → Profiler → Copywriter → envoi / draft
                    |              ↑
                 dossier        playbook + few-shots
                    |              |
   ASYNC        (résultats)     Analyste (distillation, hebdo)
                    └──────────────┘
```

---

## 3. L'apprentissage

Le sujet le plus difficile et le plus mal fait du marché. Notre approche : qualitatif et distillé d'abord, statistique seulement quand le volume existe.

### 3.1 Apprendre sur le bon signal

L'échelle du reward, du plus bruité au plus vrai :

```
envoyé  →  délivré  →  ouvert  →  répondu  →  réponse positive  →  RDV pris  →  deal
```

On **n'apprend pas avant "réponse positive"**. Les ouvertures sont un signal poubelle : Apple Mail Privacy gonfle les taux, les bots de sécurité ouvrent tout. Optimiser dessus mène à des objets clickbait qui ne convertissent pas. Le reward exploité, c'est **réponse positive** et **RDV**.

### 3.2 Pourquoi pas du ML statistique tout de suite

Le calcul du volume tranche le débat. À 30 emails/soir, 5-10% de réponse, 1-2% de positif, on récolte 0 à 1 réponse positive par nuit. Pour une significativité statistique sur un taux à quelques %, il faut des centaines d'envois par variante. On n'aura pas ce volume par ICP avant des mois.

Conclusion : l'apprentissage statistique est mort-né au départ. Le nôtre doit être **qualitatif et distillé** d'abord.

### 3.3 Les quatre couches, par valeur réelle

**Couche 1, distillation (le coeur).** L'Analyste reçoit les batchs `message envoyé → édition humaine éventuelle → résultat` et réécrit un **playbook en langage naturel, par ICP** :

> "Nightlife : l'accroche par preuve sociale locale a sorti 4 réponses, les génériques 0. Angle gagnant : citer un event récent du prospect dès la 1re ligne."

Ce playbook est réinjecté dans le prompt du Copywriter. Interprétable, corrigeable à la main, efficace à faible volume. C'est ça, l'apprentissage réel.

**Couche 2, stats structurée.** Chaque message est taggé sur des attributs catégoriels : angle (douleur / preuve sociale / curiosité / connexion commune), longueur, type de CTA, profondeur de perso, canal, ICP, expéditeur, créneau. On suit le taux de réponse positive **par valeur d'attribut**, pas par texte libre. Agréger sur 6 à 8 dimensions est exploitable bien plus vite qu'un vrai test statistique. Ça nourrit la couche 1 avec des chiffres.

**Couche 3, retrieval (la vectorisation).** Sert au few-shot. Au moment de rédiger, on récupère les k messages gagnants passés et on les met en exemple. Point clé : **on vectorise le profil du prospect, pas le texte du message.** L'axe utile est "pour ce type de prospect, quelles accroches ont marché", pas "quels messages se ressemblent". L'erreur classique produit du survivorship bias sur le style.

**Couche 4, bandit (plus tard).** Quand le volume existe : Thompson sampling au niveau de l'**angle** (4-5 bras max), jamais au niveau du message. Pas avant d'avoir la data, sinon on exploite du bruit.

### 3.4 Le signal le plus précieux : humain + IA

Constat de terrain : la version `IA éditée par l'humain` convertit souvent mieux que le full auto.

Chaque édition humaine d'un draft produit une **paire de préférence** : `version IA → version éditée → résultat`. La plupart des outils la jettent. SweeLeads la stocke et en fait la **priorité d'apprentissage** de l'Analyste.

En pratique, ce que l'humain ajoute est presque toujours **l'insight prospect-spécifique**, donc du renseignement. La boucle se referme : mieux on renseigne, moins l'humain a besoin d'éditer, et ce qu'il édite quand même devient le prochain enseignement.

### 3.5 Ordre de construction

1. Tracking propre du reward (réponse positive détectée, pas ouverture).
2. Capture des diffs d'édition humaine.
3. Playbook distillé par ICP.
4. Puis retrieval (vectorisation profil).
5. Puis stats structurée.
6. Bandit en dernier, une fois le volume atteint.

---

## Modèle de données de la boucle (esquisse)

- **`messages`** : le message + tous ses attributs catégoriels.
- **`outcomes`** : résultat sur l'échelle de reward, avec fenêtre d'attribution.
- **`edits`** : diff de chaque édition humaine (la paire de préférence).
- **`playbook`** : document langage naturel par ICP, réécrit par l'Analyste.
- **`dossiers`** : renseignement sourcé, chaque fait cité.

---

## Principe directeur

Le renseignement d'abord, l'algo ensuite. Ne jamais apprendre d'un signal qu'on ne peut pas mesurer proprement. Distiller du terrain, pas des ouvertures.
