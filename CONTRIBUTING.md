# Guide de contribution

## 🎯 Principes

1. **Code propre**: Suivre les conventions existantes
2. **Tests**: Valider les modifications
3. **Documentation**: Commenter les sections complexes
4. **Commits clairs**: Messages de commit explicites

## 📝 Commits conventionnels

Format: `type: description`

Types acceptés:

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, sans changement logique
- `refactor`: Restructuration du code
- `perf`: Optimisation de performance
- `test`: Ajout ou modification de tests
- `chore`: Tâches de maintenance

Exemples:

```
feat: Add student grade export to PDF
fix: Correct absence date calculation
docs: Update API documentation
style: Format code with Prettier
refactor: Extract message service into hooks
perf: Optimize grade loading with pagination
```

## 🔄 Processus de développement

1. **Fork** le repository
2. **Créer une branche**: `git checkout -b feature/ma-feature`
3. **Coder** en respectant les conventions
4. **Committer**: `git commit -m "type: description"`
5. **Push**: `git push origin feature/ma-feature`
6. **Pull Request**: Décrire les changements

## 🏗️ Structure du code

### Backend

```javascript
// Routes: /backend/routes/resource.js
const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(["parent", "eleve"]));

// GET /api/resource
router.get("/", async (req, res) => {
  try {
    // Logique
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
```

### Frontend

```jsx
// Pages: /frontend/src/pages/Resource/Resource.jsx
import React, { useState, useEffect } from "react";
import Card from "../../components/UI/Card";
import { resourceAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function Resource() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await resourceAPI.getAll();
      setData(response.data);
    } catch (error) {
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Resource</h1>
      {/* Contenu */}
    </div>
  );
}
```

## 🎨 Conventions de style

### Backend

- Indentation: 2 espaces
- Camelcase pour les variables/fonctions
- Noms explicites (`getUserById` au lieu de `getUser`)
- Commenter les sections complexes

### Frontend

- Indentation: 2 espaces
- Composants: PascalCase
- Fichiers: PascalCase (composants), camelCase (hooks)
- Tailwind classes: ordre alphabétique quand possible

## 🧪 Testing

### Backend

```bash
npm test                # Tous les tests
npm test -- --watch    # Mode watch
```

### Frontend

```bash
npm run lint           # ESLint
npm test              # Jest
```

## 📦 Dépendances

Avant d'ajouter une dépendance:

1. Vérifier s'il n'existe pas déjà
2. Justifier l'ajout
3. Vérifier la taille du bundle
4. Mettre à jour la documentation

## 🚀 Performance

- Utiliser le lazy loading pour les pages
- Minimiser les requêtes API
- Optimiser les images
- Utiliser React.memo pour les composants lourds

## 🔒 Sécurité

- Ne jamais committer les `.env`
- Valider les entrées utilisateur
- Utiliser les paramètres préparés (SQL injection)
- Échapper les sorties HTML (XSS)
- CSRF tokens pour les formulaires sensibles

## ✅ Checklist avant PR

- [ ] Code testé localement
- [ ] Pas de console.log() de débogage
- [ ] Commit messages clairs
- [ ] Pas de changements de formatage inutiles
- [ ] Tests ajoutés si applicable
- [ ] Documentation mise à jour
- [ ] Performance vérifiée

## 📞 Questions?

Consulter:

- [API.md](./API.md)
- [README.md](./README.md)
- Issues GitHub
- Discussion avec l'équipe
