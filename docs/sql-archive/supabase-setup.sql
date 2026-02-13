-- Script SQL pour créer la table profiles dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Créer la table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nom_complet TEXT NOT NULL,
  email TEXT NOT NULL,
  specialite TEXT NOT NULL,
  rpps TEXT NOT NULL,
  cabinet TEXT NOT NULL,
  adresse_cabinet TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Activer Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Politique : Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Politique : Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Créer un index sur l'email pour les recherches
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

