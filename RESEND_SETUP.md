# Configuration Resend pour l'Envoi d'Email Différé

## Installation

La dépendance `resend` est déjà ajoutée dans `package.json`. Installez-la avec :

```bash
npm install
```

## Configuration

### 1. Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte
3. Vérifiez votre domaine (ou utilisez le domaine de test fourni)

### 2. Obtenir la clé API

1. Dans le dashboard Resend, allez dans "API Keys"
2. Créez une nouvelle clé API
3. Copiez la clé (commence par `re_`)

### 3. Configurer les variables d'environnement

Ajoutez dans `.env.local` :

```env
# Clé API Resend
RESEND_API_KEY=re_votre_cle_api_ici

# Email expéditeur (doit être vérifié dans Resend)
EMAIL_FROM=noreply@votredomaine.com

# URL de base de l'application (pour construire les liens)
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

## Fonctionnement

### Architecture

1. **Programmation** : L'email est programmé avec `setTimeout` côté serveur
2. **Stockage** : L'email est capturé dans la closure du `setTimeout` (pas dans une Map)
3. **Envoi** : À la date programmée, Resend envoie l'email
4. **Nettoyage** : Après envoi, l'email est garbage collected

### Sécurité

- ✅ **Pas de stockage persistant** : L'email n'est pas dans une Map accessible
- ✅ **Closure uniquement** : L'email existe seulement dans la closure du setTimeout
- ✅ **Logs anonymes** : Aucun email dans les logs serveur
- ✅ **Suppression après envoi** : Garbage collection automatique

### Limitations

⚠️ **Redémarrage serveur** : Si le serveur redémarre, les emails programmés sont perdus.

**Solution pour production** : Utiliser un service externe comme :
- Upstash Workflow
- BullMQ avec Redis
- Resend Scheduled Emails (si disponible)

## Test

1. Configurez `RESEND_API_KEY` dans `.env.local`
2. Créez un questionnaire
3. Programmez un envoi pour J+1 (test rapide)
4. Vérifiez votre boîte email à la date programmée

## Format de l'Email

L'email envoyé contient :
- Titre : "Questionnaire médical - Medi.Link"
- Message personnalisé
- Bouton "Accéder au questionnaire" (lien vers `/survey/[id]`)
- Avertissement sur la suppression automatique

---

**Note** : En développement sans `RESEND_API_KEY`, les emails sont simulés dans la console.



