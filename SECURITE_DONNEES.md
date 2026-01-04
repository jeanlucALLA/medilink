# Sécurité des Données - Cycle de Vie RGPD/HDS

## Architecture de Non-Persistance

### 1. Stockage Uniquement en Mémoire Client

**Localisation :** `app/consultation/page.tsx`

Les données sont stockées **exclusivement** dans le state React (`useState`) côté client :
- ✅ **Aucune base de données** (pas de SQLite, PostgreSQL, MongoDB)
- ✅ **Aucun stockage serveur** (pas de fichiers, pas de cache serveur)
- ✅ **Aucun localStorage/sessionStorage** (évite la persistance navigateur)
- ✅ **Mémoire RAM uniquement** (disparition au rechargement de page)

```typescript
const [notes, setNotes] = useState<PatientNote[]>([])
```

### 2. Auto-Destruction après 60 Minutes

**Mécanisme :** TTL (Time To Live) avec nettoyage automatique

Chaque note contient :
- `createdAt` : Timestamp de création
- `expiresAt` : Timestamp d'expiration (createdAt + 60 minutes)

**Nettoyage automatique :**
```typescript
useEffect(() => {
  const cleanup = () => {
    const now = Date.now()
    setNotes((prevNotes) => 
      prevNotes.filter((note) => note.expiresAt > now)
    )
  }
  
  // Nettoyage immédiat + toutes les minutes
  cleanup()
  intervalRef.current = setInterval(cleanup, 60000)
  
  return () => clearInterval(intervalRef.current)
}, [])
```

### 3. Suppression Manuelle Immédiate

**Bouton "Supprimer maintenant" :**
- Suppression immédiate de la note sélectionnée
- Aucune trace résiduelle
- Log dans la console pour audit

**Bouton "Supprimer toutes" :**
- Suppression de toutes les notes en mémoire
- Confirmation requise avant suppression

### 4. Export PDF Côté Client

**Génération locale :** Utilisation de `jsPDF` côté client uniquement

```typescript
const generatePDF = async (note: PatientNote) => {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  // ... génération PDF
  doc.save(fileName) // Téléchargement local uniquement
}
```

**Caractéristiques :**
- ✅ Génération 100% côté client (navigateur)
- ✅ Aucune transmission au serveur
- ✅ Téléchargement direct sur l'ordinateur du praticien
- ✅ Avertissement dans le PDF : "Non stocké sur serveur"

## Cycle de Vie des Données

### Étape 1 : Création
```
Utilisateur saisit → Validation → Stockage en mémoire React
└─ createdAt: Date.now()
└─ expiresAt: createdAt + 3600000ms (60 min)
```

### Étape 2 : Vie Active
```
Note en mémoire → Affichage dans l'interface
└─ Compteur de temps restant visible
└─ Boutons d'action disponibles (PDF, Supprimer)
```

### Étape 3 : Nettoyage Automatique
```
Toutes les 60 secondes → Vérification TTL
└─ Si expiresAt < Date.now() → Suppression
└─ Log dans console pour audit
```

### Étape 4 : Destruction
```
Suppression → Note retirée du state React
└─ Garbage collection JavaScript
└─ Aucune trace sur disque
└─ Aucune trace sur serveur
```

## Garanties de Sécurité

### ✅ Non-Persistance Serveur
- **Aucune API** ne reçoit les données
- **Aucun endpoint** backend n'est appelé
- **Aucun fichier** n'est écrit sur le serveur
- **Aucun log** ne contient les données sensibles

### ✅ Non-Persistance Client
- **Pas de localStorage** : données non sauvegardées navigateur
- **Pas de sessionStorage** : données non sauvegardées session
- **Pas de cookies** : aucune trace dans les cookies
- **Mémoire volatile** : disparition au rechargement

### ✅ Conformité RGPD
- **Droit à l'effacement** : Suppression immédiate possible
- **Minimisation des données** : Stockage minimal nécessaire
- **Durée de conservation** : Maximum 60 minutes
- **Transparence** : Utilisateur informé du cycle de vie

### ✅ Conformité HDS (Hébergeur de Données de Santé)
- **Pas d'hébergement** : Données jamais sur serveur
- **Chiffrement transit** : HTTPS (Next.js par défaut)
- **Traçabilité** : Logs d'audit dans console (optionnel)
- **Isolation** : Chaque session navigateur = données isolées

## Points d'Attention

### ⚠️ Limites du Stockage Mémoire
1. **Rechargement de page** : Toutes les données sont perdues
2. **Fermeture navigateur** : Toutes les données sont perdues
3. **Session expirée** : Toutes les données sont perdues

**Recommandation :** Exporter en PDF avant fermeture si nécessaire

### ⚠️ Audit et Traçabilité
Les logs dans la console permettent de tracer :
- Création de notes
- Suppressions manuelles
- Suppressions automatiques

**Note :** Ces logs sont locaux et ne sont pas envoyés au serveur.

## Recommandations d'Utilisation

1. **Export PDF systématique** : Exporter les notes importantes avant fermeture
2. **Suppression manuelle** : Utiliser "Supprimer maintenant" après consultation
3. **Fermeture de session** : Fermer l'onglet/navigateur après usage
4. **Pas de partage d'écran** : Éviter de partager l'écran avec les données visibles

## Vérification de Conformité

Pour vérifier qu'aucune donnée n'est persistée :

1. **Inspecter le réseau** (F12 → Network) : Aucune requête POST/PUT avec données
2. **Inspecter le localStorage** (F12 → Application) : Vide
3. **Inspecter les cookies** (F12 → Application) : Aucun cookie de données
4. **Vérifier les logs serveur** : Aucune trace de données patients
5. **Recharger la page** : Toutes les données disparaissent

---

**Date de création :** $(date)
**Version :** 1.0
**Conforme :** RGPD, HDS



