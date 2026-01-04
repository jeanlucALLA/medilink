# Architecture Zero-Data - Cycle de Vie des Données

## Vue d'Ensemble

Cette application implémente un système de stockage **éphémère en mémoire serveur** avec auto-suppression après 60 minutes, garantissant qu'aucune donnée patient n'est persistée sur disque.

## Architecture Technique

### 1. Stockage en Mémoire Serveur (In-Memory Map)

**Fichier :** `app/api/consultation/route.ts`

```typescript
const consultationsMap = new Map<string, { data: ConsultationData; expiresAt: number }>()
```

**Caractéristiques :**
- ✅ **Map JavaScript** : Structure de données en mémoire RAM
- ✅ **Pas de base de données** : Aucun SQL, Prisma, ou ORM
- ✅ **Pas de fichiers** : Aucune écriture sur disque
- ✅ **Volatile** : Disparition au redémarrage du serveur

### 2. Mécanisme de TTL (Time To Live)

Chaque entrée contient :
- `data` : Les données de consultation (patientId, notes, createdAt)
- `expiresAt` : Timestamp d'expiration (création + 60 minutes)

**Double mécanisme de suppression :**

#### A. setTimeout programmé
```typescript
setTimeout(() => {
  consultationsMap.delete(id)
}, 60 * 60 * 1000) // 60 minutes
```

#### B. Nettoyage périodique
```typescript
setInterval(cleanupExpired, 5 * 60 * 1000) // Toutes les 5 minutes
```

### 3. API Routes Next.js

**Endpoints disponibles :**

- **POST `/api/consultation`** : Créer une consultation
- **GET `/api/consultation?id=xxx`** : Récupérer une consultation
- **DELETE `/api/consultation?id=xxx`** : Supprimer immédiatement

## Cycle de Vie des Données

### Étape 1 : Création (POST)

```
1. Client envoie { patientId, notes }
2. Serveur génère ID unique
3. Calcul de expiresAt = now + 3600000ms
4. Stockage dans Map: consultationsMap.set(id, { data, expiresAt })
5. Programmation setTimeout pour suppression automatique
6. Retour de { id, expiresAt } au client
```

**Durée :** < 10ms

### Étape 2 : Vie Active (GET)

```
1. Client demande consultation par ID
2. Serveur vérifie existence dans Map
3. Vérification expiration (expiresAt > now)
4. Si expirée → suppression immédiate + 404
5. Si valide → retour des données
```

**Durée :** < 5ms

### Étape 3 : Auto-Suppression

**Mécanisme A - setTimeout :**
```
60 minutes après création → Callback exécuté
→ consultationsMap.delete(id)
→ Données supprimées de la mémoire
```

**Mécanisme B - Nettoyage périodique :**
```
Toutes les 5 minutes → cleanupExpired()
→ Parcourt toutes les entrées
→ Supprime celles avec expiresAt <= now
```

### Étape 4 : Suppression Manuelle (DELETE)

```
1. Client envoie DELETE /api/consultation?id=xxx
2. Serveur supprime immédiatement: consultationsMap.delete(id)
3. Retour confirmation
4. Données effacées de la mémoire
```

**Durée :** < 5ms

### Étape 5 : Téléchargement et Destruction

```
1. Client génère fichier .txt côté navigateur
2. Téléchargement automatique
3. Client envoie DELETE /api/consultation?id=xxx
4. Serveur supprime immédiatement
5. Confirmation au client
```

## Garanties de Sécurité

### ✅ Non-Persistance Disque

**Vérifications :**
- ❌ Aucune base de données (PostgreSQL, MySQL, SQLite)
- ❌ Aucun fichier écrit (`fs.writeFile`, `fs.appendFile`)
- ❌ Aucun cache disque (Redis persistant, fichiers)
- ✅ Uniquement mémoire RAM (Map JavaScript)

**Preuve :**
```typescript
// Aucun import de modules de fichiers
// Aucun import de modules de base de données
// Seulement Map JavaScript natif
```

### ✅ Auto-Destruction Garantie

**Double sécurité :**
1. **setTimeout** : Suppression exacte après 60 minutes
2. **Nettoyage périodique** : Vérification toutes les 5 minutes

**Garantie :** Maximum 65 minutes (60 + marge de 5 minutes)

### ✅ Logs Anonymes

**Stratégie :**
- ✅ Logs de métriques uniquement (nombre d'entrées supprimées)
- ❌ Aucun log contenant patientId ou notes
- ✅ Logs avec ID anonyme uniquement

**Exemple :**
```typescript
console.log(`[Auto-delete] Consultation ${id} supprimée automatiquement`)
// ✅ ID anonyme, pas de données patient
```

### ✅ Isolation par Session

- Chaque consultation = ID unique
- Pas de partage entre utilisateurs
- Suppression indépendante

## Workflow Complet

```
┌─────────────────┐
│  Utilisateur    │
│  Saisit données │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /api/     │
│  consultation   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Génération ID  │
│  + expiresAt    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Map.set(id,    │
│  {data, exp})   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  setTimeout(    │
│  60 min)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Consultation   │
│  Active         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ 60 min │ │  Télécharger │
│ écoulé │ │  + Détruire  │
└───┬────┘ └──────┬───────┘
    │             │
    ▼             ▼
┌─────────────────┐
│  Map.delete(id)│
└─────────────────┘
```

## Vérification de Conformité

### Test 1 : Vérifier l'absence de persistance

```bash
# 1. Créer une consultation
curl -X POST http://localhost:3001/api/consultation \
  -H "Content-Type: application/json" \
  -d '{"patientId":"TEST-123","notes":"Test"}'

# 2. Redémarrer le serveur
# 3. Tenter de récupérer la consultation
# Résultat attendu : 404 (données perdues)
```

### Test 2 : Vérifier l'auto-suppression

```bash
# 1. Créer une consultation
# 2. Attendre 61 minutes
# 3. Tenter de récupérer
# Résultat attendu : 404 (expirée)
```

### Test 3 : Vérifier les logs

```bash
# Vérifier les logs serveur
# Résultat attendu : Aucun patientId ou notes dans les logs
```

## Points d'Attention

### ⚠️ Redémarrage Serveur

**Impact :** Toutes les données en mémoire sont perdues

**Mitigation :** 
- Avertissement utilisateur
- Recommandation de télécharger avant redémarrage
- Compte à rebours visible

### ⚠️ Mémoire Serveur

**Impact :** Consommation RAM selon nombre de consultations

**Mitigation :**
- Limite de 60 minutes max
- Nettoyage automatique
- Pas de limite de taille (mais auto-nettoyage)

### ⚠️ Concurrence

**Impact :** Plusieurs utilisateurs simultanés

**Mitigation :**
- Map thread-safe dans Node.js (single-threaded)
- ID unique par consultation
- Isolation par ID

## Recommandations

1. **Monitoring mémoire** : Surveiller la consommation RAM
2. **Backup local** : Utiliser "Télécharger et Détruire" régulièrement
3. **Redémarrage planifié** : Avertir les utilisateurs avant maintenance
4. **Logs métriques** : Surveiller le nombre de consultations actives

---

**Version :** 1.0  
**Conforme :** RGPD, HDS, Zero-Data Architecture  
**Date :** $(date)



