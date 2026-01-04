# Guide : Modèles Standards Communautaires

## 📚 Modèles Standards Disponibles

Trois modèles standards ont été créés pour aider les nouveaux utilisateurs à démarrer rapidement.

## 🚀 Installation

### Étape 1 : Exécuter le script SQL

1. Allez dans votre projet Supabase
2. Ouvrez l'éditeur SQL
3. Exécutez le script `supabase-insert-default-templates.sql`
4. Vérifiez que les 3 modèles ont bien été insérés

### Étape 2 : Vérification

Exécutez cette requête pour vérifier :

```sql
SELECT id, title, category, is_system_template, is_approved
FROM community_templates 
WHERE is_system_template = true
ORDER BY created_at;
```

Vous devriez voir 3 modèles :
- Bilan de Satisfaction Globale
- Suivi d'Évolution (Post-Séance)
- Évaluation de la Douleur / Gêne

## 📋 Les 3 Modèles Standards

### Modèle A : Bilan de Satisfaction Globale

**Description** : Questionnaire standard pour évaluer la satisfaction globale du patient concernant l'accueil, le traitement et l'expérience globale.

**Questions** :
1. "Comment évaluez-vous l'accueil et la prise en charge ?" (Échelle 1-5)
2. "Le traitement a-t-il répondu à vos attentes ?" (Échelle 1-5)
3. "Recommanderiez-vous ce cabinet à un proche ?" (Oui/Non)

**Tags** : Satisfaction, Bien-être, Évaluation
**Catégorie** : Satisfaction Globale

### Modèle B : Suivi d'Évolution (Post-Séance)

**Description** : Questionnaire pour évaluer l'évolution du patient après une séance de traitement.

**Questions** :
1. "Comment vous sentez-vous depuis la dernière séance ?" (Échelle 1-5)
2. "Notez l'amélioration de vos symptômes (1 à 5)" (Échelle 1-5)
3. "Avez-vous remarqué des effets secondaires ou des gênes particulières ?" (Texte libre)

**Tags** : Suivi, Post-opératoire, Évolution
**Catégorie** : Suivi de Douleur

### Modèle C : Évaluation de la Douleur / Gêne

**Description** : Questionnaire standard pour évaluer précisément le niveau de douleur et son impact sur la vie quotidienne.

**Questions** :
1. "Sur une échelle de 0 à 10, quel est votre niveau de douleur actuel ?" (Échelle 1-5)
2. "À quel moment de la journée la gêne est-elle la plus forte ?" (Texte libre)
3. "La douleur impacte-t-elle votre sommeil ?" (Oui/Non)

**Tags** : Douleur, Gêne, Évaluation
**Catégorie** : Suivi de Douleur

## 🎯 Utilisation

### Accéder aux modèles standards

1. Allez dans **Dashboard > Questionnaire**
2. Cliquez sur l'onglet **"Exploration Communautaire"**
3. Les modèles standards apparaissent en haut de la liste avec un badge **"✓ Standard"** vert

### Importer un modèle standard

1. Dans l'onglet "Exploration Communautaire", trouvez le modèle souhaité
2. Cliquez sur **"Importer dans mes modèles"**
3. Le formulaire de création se pré-remplit automatiquement avec :
   - La pathologie
   - Les questions
4. **Modifiez** les questions si nécessaire pour les adapter à votre pratique
5. Cliquez sur **"Créer le questionnaire"** pour générer le lien

## 🔒 Sécurité et Lecture Seule

### Protection des modèles standards

- Les modèles standards ont `is_system_template = true`
- Ils sont **en lecture seule** : vous ne pouvez pas les modifier directement
- Vous devez les **importer** pour créer votre propre version modifiable
- Les modèles standards ne peuvent pas être supprimés par les utilisateurs

### Badge "Standard"

- Les modèles standards affichent un badge **"✓ Standard"** vert en haut à droite de la carte
- Ce badge indique que le modèle est officiel et approuvé
- Il rassure les utilisateurs sur la qualité du modèle

## 📊 Affichage dans l'Interface

### Ordre d'affichage

Les modèles sont triés par :
1. **Modèles système en premier** (avec badge "Standard")
2. **Nombre d'utilisations** (décroissant)
3. **Nombre de votes** (décroissant)

### Filtres disponibles

Vous pouvez filtrer les modèles par :
- **Catégorie** : Satisfaction Globale, Suivi de Douleur, etc.
- **Tags** : Satisfaction, Douleur, Suivi, etc.

## ✅ Checklist de vérification

- [ ] J'ai exécuté le script SQL `supabase-insert-default-templates.sql`
- [ ] Les 3 modèles apparaissent dans Supabase avec `is_system_template = true`
- [ ] Les modèles s'affichent dans l'onglet "Exploration Communautaire"
- [ ] Le badge "✓ Standard" apparaît sur les modèles standards
- [ ] Je peux importer un modèle et le modifier
- [ ] Les modèles standards sont en lecture seule (impossible de les modifier directement)

## 🐛 Dépannage

### Les modèles n'apparaissent pas

- **Vérifiez** : Que le script SQL a bien été exécuté
- **Vérifiez** : Que `is_approved = true` et `is_system_template = true`
- **Vérifiez** : Que vous êtes bien connecté
- **Vérifiez** : Les logs de la console pour voir les erreurs

### Le badge "Standard" n'apparaît pas

- **Vérifiez** : Que `is_system_template = true` dans Supabase
- **Vérifiez** : Que la colonne `is_system_template` est bien récupérée dans la requête

### Impossible d'importer

- **Vérifiez** : Que vous êtes bien connecté
- **Vérifiez** : Les logs de la console pour voir les erreurs
- **Vérifiez** : Que le modèle a bien des questions

## 🎯 Prochaines étapes

Après avoir importé un modèle standard :

1. **Personnalisez** les questions selon vos besoins
2. **Testez** le questionnaire avec un patient
3. **Ajustez** si nécessaire
4. **Partagez** votre version améliorée avec la communauté si vous le souhaitez

---

**Note** : Les modèles standards sont conçus pour être agnostiques et adaptables à tous les types de pratiques médicales.


