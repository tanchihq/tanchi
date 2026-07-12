# SweeLeads

> Moteur de prospection B2B autonome, open source, self-hostable. L'IA source, renseigne, rédige et relance chaque soir. Vous gardez la main sur l'envoi. Le système apprend de ce qui convertit vraiment, pas de ce qui fait joli.

---

## La thèse

La plupart des outils de prospection IA vendent deux mensonges : le "full auto multi-canal" (en vrai seul l'email est automatisable proprement) et "l'IA apprend de vos résultats" (en vrai, à faible volume, ils optimisent sur les ouvertures, un signal poubelle).

SweeLeads prend le contre-pied :

- **Email-first.** Le reste des canaux en assisté (l'IA rédige, l'humain envoie).
- **Renseignement prospect** traité comme un pipeline de vérification à part entière.
- **Apprentissage qualitatif distillé** avant d'être statistique. Interprétable, corrigeable, efficace dès le premier mois.
- **Collaboration humain + IA** exploitée comme signal principal, pas jetée.

Le détail du moteur (sourcing, renseignement, agents, apprentissage) est dans **[README-moteur.md](./README-moteur.md)**. C'est le coeur du projet.

Construit d'abord pour un usage interne (Sweescape), pensé pour être ouvert.

---

## Ce que fait l'outil

1. **Setup entreprise.** Société, 1 à 3 ICP, ressources versées (site, doc produit, plaquette, cas clients). Base de connaissance des agents.
2. **Setup canaux.** Activation par canal, avec la capacité réelle de chacun affichée honnêtement.
3. **Sourcing quotidien.** Chaque soir, de nouveaux leads qualifiés sur les ICP.
4. **Renseignement + choix du canal.** Dossier sourcé par lead, canal le plus pertinent choisi.
5. **Rédaction.** Message personnalisé, nourri des accroches gagnantes passées.
6. **Envoi.** Auto sur email si le lead est en mode "auto". Sinon draft prêt à valider.
7. **Suivi et relances.** État de chaque prospect suivi, relances planifiées dans le cycle du soir.
8. **Apprentissage.** Distillation de ce qui convertit par ICP, réinjecté dans la rédaction.

---

## L'interface : épurée, simple, prise en main immédiate

Exigence produit de premier ordre, pas un détail cosmétique. L'outil doit se prendre en main sans doc.

- **Un écran, un job.** Setup, puis un dashboard quotidien qui montre les leads du soir, leur dossier, le message proposé, et l'état des relances. Rien de plus à l'écran par défaut.
- **La revue de messages est l'action centrale.** Une file de drafts à valider, éditer ou envoyer, en quelques secondes chacun. C'est là que l'humain passe son temps, donc c'est là que l'UX doit être irréprochable.
- **Le mode auto est explicite et réversible.** On voit toujours ce qui part tout seul et ce qui attend validation. Pas de magie opaque.
- **Zéro jargon dans l'UI.** Pas de "bandit", pas de "vectorisation" exposés. Les enseignements sont montrés en langage clair ("ce qui marche sur cet ICP en ce moment").
- **Onboarding guidé.** Setup entreprise + ICP + ressources en un parcours linéaire, pas un panneau de 40 champs.

Sobriété visuelle, hiérarchie claire, densité maîtrisée. L'objectif : un commercial ouvre l'appli le soir, valide sa file en 10 minutes, ferme.

---

## Les canaux : capacité réelle

L'honnêteté sur ce point est un choix produit assumé dans l'UI.

| Canal | Auto | Réalité |
|---|---|---|
| **Email** | Oui | Le seul vraiment automatisable. Cold B2B légal en FR (identification + opt-out). Canal prioritaire. |
| **LinkedIn** | Non | Automatisation = violation du User Agreement, ban. Draft assisté + envoi manuel. |
| **WhatsApp** | Non | API officielle : opt-in + templates. Libs non officielles : numéro cramé. |
| **Instagram** | Non | ToS + rate limits + ban. Draft assisté. |
| **SMS** | Partiel | Selon provider et conformité opt-in. |
| **Cold call** | Non | Script généré + log d'appel. Pas d'agent vocal. |

**Mode "auto" = email uniquement.** Le reste, l'IA rédige, l'humain envoie.

---

## Emailing

Approche V1, simple et directe : on passe par le **serveur mail du ou des commerciaux**. Les mails partent depuis leur propre adresse, pas depuis un domaine tiers. C'est plus simple à mettre en place et meilleur pour la délivrabilité et la crédibilité.

**Warm-up.** Un système de montée en charge progressive est à prévoir : un compte qui se met à envoyer du volume d'un coup se fait flaguer. Le warm-up chauffe la réputation de l'adresse avant de monter les cadences. À intégrer tôt, même en version simple (montée graduelle du nombre d'envois/jour).

Les autres canaux ne sont pas automatiques (voir tableau).

---

## Stack

**Front**
- TypeScript
- React
- Vite

**Back**
- Hono (TS)

**Auth**
- Better Auth (multi-tenant)

**Données**
- PostgreSQL (données métier)
- Redis (files et batchs du soir)

**IA**
- Anthropic API, ou CLI selon config (voir plus bas)

**Recherche**
- `web_fetch` prioritaire sur `web_search` pour la vérification des dossiers

**Emailing**
- Serveur mail du commercial, warm-up progressif

---

## Configuration IA : CLI ou clé API

Au moment de créer le compte, on choisit :

- **Self-hosted :** clé API de l'utilisateur. Recommandé, le batch de nuit tourne dessus.
- **SaaS hébergé :** notre propre API avec facturation d'usage.

Note : l'abonnement type Max via CLI interactif n'est pas fait pour du batch serveur nocturne. Self-hosted = clé API.

---

## Self-hosted vs SaaS

- **Open source, self-hosted, gratuit.** Vous branchez votre clé, vous hébergez, vous assumez votre conformité et votre sourcing.
- **SaaS hébergé, payant.** Usage géré, facturation, mises à jour. Modèle pour usage interne facturé et pour la revente.

---

## Roadmap

**V1**
- Setup entreprise + ICP + ressources
- Sourcing du soir + pipeline renseignement vérifié
- Rédaction email + envoi auto (email uniquement)
- Emailing via serveur commercial + warm-up simple
- Suivi + relances
- Tracking propre du reward, capture des diffs d'édition, playbook distillé par ICP
- Interface épurée, onboarding guidé

**V2**
- Retrieval / vectorisation sur profil prospect
- Stats structurée par attribut
- Canaux assistés (LinkedIn, WhatsApp draft)

**V3**
- Bandit sur l'angle une fois le volume atteint
- Multi-tenance durcie pour la revente
- Conformité RGPD renforcée pour usage externe

---

## Statut

Pré-alpha. Usage interne Sweescape d'abord. Ouverture publique une fois la boucle de conversion prouvée sur données réelles.
