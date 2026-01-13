# 🏎️ Turbo Racer

Turbo Racer est un jeu de course arcade en **JavaScript** jouable sur navigateur desktop et contrôlé via **smartphone** grâce à **Socket.IO**.  
Un ou deux joueurs peuvent jouer simultanément en local, chaque mobile servant de manette.

---

## 🚀 Fonctionnalités

- 🎮 Contrôle du jeu via smartphone
- 👤 Mode solo (1 joueur)
- 👥 Mode multijoueur local (2 joueurs max)
- ⚡ Difficulté dynamique (vitesse & obstacles)
- 💥 Détection des collisions
- 🏁 Écran de fin de partie avec vainqueur
- 📱 Interface mobile optimisée (retour visuel + vibration)
- 🖥️ Interface desktop avec Canvas HTML5

---

## 🗂️ Structure du projet

.
├── server.js
├── public
│ ├── desktop
│ │ ├── index.html
│ │ ├── game.js
│ │ └── style.css
│ └── mobile
│ ├── index.html
│ ├── controller.js
│ └── style.css
└── README.md

---

## 🛠️ Prérequis

- Node.js (v16 ou plus)
- Un navigateur web moderne
- Un ou deux smartphones connectés au **même réseau local** que le PC

---

## 📦 Installation

Clone le dépôt :

```bash
git clone https://github.com/xavbge/racing-car-multi.git
cd turbo-racer
