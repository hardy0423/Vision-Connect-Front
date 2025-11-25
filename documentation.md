# VISION CONNECT
## _Documentation Téchinique_

Cette documentation concerne le projet Vision Connect, dont les objectifs principaux sont :

- Gestion des véhicules
- Géolocalisation et tracking
- Gestion à distance des véhicules

---
### Commencez par installer le backend en premier.
# 🚀 Installation du Frontend - Vision Connect  

## 📌 Prérequis  
Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :  
- **Docker** pour la gestion des conteneurs  
- **Git** pour cloner le projet  

---

### 📥 Cloner le projet

1. Clonez le projet depuis le dépôt GitLab :  
```bash
git clone https://gitlab.com/futurmap/sig/vision-connect/frontend
```

2. Allez dans le répertoire approprié (Frontend) :  
```bash
cd frontend  # ou cd backend
```

---

### 🛠 Lancer l'application

3. Construisez et démarrez les services Docker :  
```bash
docker-compose up -d --build
```

Cela va télécharger et construire les images nécessaires, puis lancer les conteneurs en arrière-plan.

---

Une fois ces étapes terminées, vous pourrez accéder à l'application via le navigateur
---