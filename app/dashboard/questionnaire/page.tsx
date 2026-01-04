'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Link as LinkIcon, Mail, Eye, Download, AlertCircle, Calendar, Save, Upload, X, Info, ExternalLink, CheckCircle, Loader2, Send, Star, BookOpen, Users, Share2, ThumbsUp, Filter } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { pathologyModels, getPathologyModel, getPathologyNames, type QuestionModel } from '@/constants/pathologies'
import {
  getCustomModels,
  saveCustomModel,
  deleteCustomModel,
  exportModels,
  importModels,
  type PathologyModel as CustomPathologyModel
} from '@/lib/pathology-models-storage'
import { getGoogleReviewUrl, updateGoogleReviewUrl } from '@/lib/practitioner-settings'
import * as supabaseModule from '@/lib/supabase'
// eslint-disable-next-line no-undef
const supabase = (supabaseModule as any).supabase as SupabaseClient

interface Questionnaire {
  id: string
  title: string
  questionCount: number
  createdAt: number
  expiresAt: number
  hasResponse: boolean
  responseViewed: boolean
  is_favorite?: boolean
  pathologie?: string
  questions?: any[]
}

export default function QuestionnairePage() {
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const [pathology, setPathology] = useState('')
  const [questions, setQuestions] = useState<string[]>(['']) // Liste simple de questions (texte uniquement)
  const [selectedPathology, setSelectedPathology] = useState<string>('') // Gardé pour compatibilité avec modèles si nécessaire
  const [title, setTitle] = useState('') // Gardé pour compatibilité
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [generatedQuestionnaireId, setGeneratedQuestionnaireId] = useState<string | null>(null)
  const [patientEmail, setPatientEmail] = useState('')
  const [sendDate, setSendDate] = useState('')
  const [sendDelayDays, setSendDelayDays] = useState<number>(14) // Nombre de jours avant l'envoi (défaut: 14)
  // isScheduled est maintenant toujours true si un email est fourni, sinon false
  const isScheduled = patientEmail.trim().length > 0
  const [scheduledEmailInfo, setScheduledEmailInfo] = useState<string | null>(null)
  const [googleReviewUrl, setGoogleReviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string | null>(null)
  const [responseData, setResponseData] = useState<any>(null)

  // Gestion des modèles personnalisés
  const [customModels, setCustomModels] = useState<CustomPathologyModel[]>([])
  const [showModelManager, setShowModelManager] = useState(false)
  const [editingModel, setEditingModel] = useState<CustomPathologyModel | null>(null)
  const [newModelName, setNewModelName] = useState('')
  const [newModelDescription, setNewModelDescription] = useState('')
  const [newModelQuestions, setNewModelQuestions] = useState<QuestionModel[]>([])

  // État pour l'infobulle Google Review
  const [showGoogleReviewTooltip, setShowGoogleReviewTooltip] = useState(false)

  // États pour les templates Supabase
  const [templates, setTemplates] = useState<Array<{ id: string; pathologie_name: string; questions: string[] }>>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [existingTemplateId, setExistingTemplateId] = useState<string | null>(null)
  const [pathologySuggestions, setPathologySuggestions] = useState<string[]>([])

  // États pour l'envoi instantané - pathologies chargées depuis questionnaires
  const [availablePathologies, setAvailablePathologies] = useState<Array<{
    pathologie: string
    questions: any[]
    id?: string
  }>>([])
  const [loadingPathologies, setLoadingPathologies] = useState(false)
  const [instantPathology, setInstantPathology] = useState('')
  const [instantEmail, setInstantEmail] = useState('')
  const [sendingInstant, setSendingInstant] = useState(false)
  const [instantSuccess, setInstantSuccess] = useState<string | null>(null)
  const [instantError, setInstantError] = useState<string | null>(null)

  // États pour la bibliothèque de modèles favoris
  const [favoriteModels, setFavoriteModels] = useState<Array<{
    id: string
    pathologie: string
    questions: any[]
    is_favorite: boolean
  }>>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  // États pour la bibliothèque communautaire
  const [activeTab, setActiveTab] = useState<'my' | 'community'>('my')
  const [communityTemplates, setCommunityTemplates] = useState<Array<{
    id: string
    title: string
    description?: string
    pathologie: string
    questions: any[]
    tags: string[]
    category?: string
    usage_count: number
    vote_count: number
    created_by?: string
    is_system_template?: boolean
  }>>([])
  const [loadingCommunity, setLoadingCommunity] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')

  // États pour la personnalisation du modèle standard
  const [showSettingsSection, setShowSettingsSection] = useState(false)
  const [standardQuestions, setStandardQuestions] = useState([
    {
      id: 1,
      text: 'Comment évaluez-vous votre amélioration depuis la séance ?',
      type: 'scale', // Échelle de 1 à 5
    },
    {
      id: 2,
      text: 'Avez-vous ressenti des effets secondaires ou des douleurs ?',
      type: 'yesno', // Oui/Non
    },
    {
      id: 3,
      text: 'Avez-vous des remarques ou des questions pour votre praticien ?',
      type: 'text', // Champ texte libre
    },
  ])
  const [savingSettings, setSavingSettings] = useState(false)
  const [hasSettings, setHasSettings] = useState(false)

  // Charger les paramètres du questionnaire
  const loadQuestionnaireSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('questionnaire_settings')
        .select('questions')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors du chargement des paramètres:', error)
        return
      }

      if (data && data.questions) {
        setStandardQuestions(data.questions)
        setHasSettings(true)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres:', err)
    }
  }

  // Enregistrer les paramètres du questionnaire
  const saveQuestionnaireSettings = async () => {
    try {
      setSavingSettings(true)
      const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Vous devez être connecté')
        return
      }

      // Vérifier si des paramètres existent déjà
      const { data: existing } = await supabase
        .from('questionnaire_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const settingsData = {
        user_id: user.id,
        questions: standardQuestions,
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        // Mise à jour
        const { error } = await supabase
          .from('questionnaire_settings')
          .update(settingsData)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Insertion
        const { error } = await supabase
          .from('questionnaire_settings')
          .insert(settingsData)

        if (error) throw error
      }

      setHasSettings(true)
      alert('Modèle de questionnaire enregistré avec succès !')

      // Recharger la page pour mettre à jour la checklist
      window.location.reload()
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err)
      alert(`Erreur lors de la sauvegarde: ${err.message || 'Erreur inconnue'}`)
    } finally {
      setSavingSettings(false)
    }
  }

  // Charger les paramètres au montage
  useEffect(() => {
    loadQuestionnaireSettings()
  }, [])

  // Initialiser la date par défaut (J+14) - conservé pour compatibilité
  useEffect(() => {
    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + sendDelayDays)
    setSendDate(defaultDate.toISOString().split('T')[0])
  }, [sendDelayDays])

  // Charger les modèles personnalisés depuis LocalStorage
  useEffect(() => {
    setCustomModels(getCustomModels())
  }, [])

  // Charger le lien Google Review depuis LocalStorage
  useEffect(() => {
    const savedUrl = getGoogleReviewUrl()
    if (savedUrl) {
      setGoogleReviewUrl(savedUrl)
    }
  }, [])

  // Charger les templates depuis Supabase
  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true)
      const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('templates')
        .select('id, pathologie_name, questions')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Erreur lors du chargement des templates:', error)
        // Si la table n'existe pas, on continue sans erreur
        if (error.code === '42P01') {
          console.warn('Table templates non créée. Continuer sans templates.')
        }
        setTemplates([])
        setPathologySuggestions([])
        return
      }

      if (data && data.length > 0) {
        const formattedTemplates = data.map(t => ({
          id: t.id,
          pathologie_name: t.pathologie_name,
          questions: Array.isArray(t.questions) ? t.questions : [],
        }))
        setTemplates(formattedTemplates)
        // Mettre à jour les suggestions pour l'auto-complétion
        setPathologySuggestions(formattedTemplates.map(t => t.pathologie_name))
      } else {
        // État "zéro donnée" - pas de templates
        console.log('ℹ️ Aucun template trouvé pour cet utilisateur')
        setTemplates([])
        setPathologySuggestions([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Charger les modèles favoris depuis questionnaires
  const loadFavoriteModels = async () => {
    try {
      setLoadingFavorites(true)
      const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setFavoriteModels([])
        return
      }

      // Récupérer les questionnaires marqués comme favoris
      const { data, error } = await supabase
        .from('questionnaires')
        .select('id, pathologie, questions, is_favorite')
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .not('pathologie', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) {
        console.error('[Bibliothèque] Erreur chargement favoris:', error)
        if (error.code === '42703') {
          console.warn('Colonne is_favorite non créée. Exécutez supabase-questionnaires-add-favorite.sql')
        }
        setFavoriteModels([])
        return
      }

      if (data && data.length > 0) {
        const formattedFavorites = data.map((q: any) => ({
          id: q.id,
          pathologie: q.pathologie?.trim() || 'Sans nom',
          questions: Array.isArray(q.questions) ? q.questions : [],
          is_favorite: q.is_favorite || false,
        }))
        setFavoriteModels(formattedFavorites)
      } else {
        setFavoriteModels([])
      }
    } catch (error) {
      console.error('[Bibliothèque] Erreur:', error)
      setFavoriteModels([])
    } finally {
      setLoadingFavorites(false)
    }
  }

  // Basculer le statut favori d'un questionnaire
  const toggleFavorite = async (questionnaireId: string, currentFavoriteStatus: boolean) => {
    try {
      const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Vous devez être connecté')
        return
      }

      const { error } = await supabase
        .from('questionnaires')
        .update({ is_favorite: !currentFavoriteStatus })
        .eq('id', questionnaireId)
        .eq('user_id', user.id)

      if (error) {
        if (error.code === '42703') {
          console.warn('Colonne is_favorite non créée. Exécutez supabase-questionnaires-add-favorite.sql')
          return
        }
        throw error
      }

      loadFavoriteModels()
      loadAvailablePathologies()
    } catch (err: any) {
      console.error('Erreur toggle favori:', err)
      alert('Erreur lors de la mise à jour du favori')
    }
  }

  // Pré-charger le formulaire avec un modèle favori
  const loadFavoriteModel = (model: { pathologie: string; questions: any[] }) => {
    setPathology(model.pathologie)

    const formattedQuestions = model.questions.map((q: any) => {
      if (typeof q === 'string') {
        return q
      }
      if (q && (q.question || q.text)) {
        return q.question || q.text
      }
      return ''
    }).filter((q: string) => q.trim() !== '')

    setQuestions(formattedQuestions.length > 0 ? formattedQuestions : [''])

    setTimeout(() => {
      const formElement = document.getElementById('questionnaire-form')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Charger les modèles communautaires
  const loadCommunityTemplates = async () => {
    try {
      setLoadingCommunity(true)
      const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setCommunityTemplates([])
        return
      }

      let query = supabase
        .from('community_templates')
        .select('id, title, description, pathologie, questions, tags, category, usage_count, vote_count, created_by, is_system_template')
        .eq('is_approved', true)
        .order('is_system_template', { ascending: false })
        .order('usage_count', { ascending: false })
        .order('vote_count', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      if (selectedTag !== 'all') {
        // Filtrer par tag (supporter avec ou sans #)
        const tagToSearch = selectedTag.startsWith('#') ? selectedTag : `#${selectedTag}`
        query = query.contains('tags', [tagToSearch])
      }

      const { data, error } = await query

      if (error) {
        console.error('[Bibliothèque Communautaire] Erreur:', error)
        if (error.code === '42P01') {
          console.warn('Table community_templates non créée. Exécutez supabase-community-templates.sql')
        }
        setCommunityTemplates([])
        return
      }

      if (data && data.length > 0) {
        const formattedTemplates = data.map((t: any) => ({
          id: t.id,
          title: t.title || t.pathologie,
          description: t.description,
          pathologie: t.pathologie,
          questions: Array.isArray(t.questions) ? t.questions : [],
          tags: Array.isArray(t.tags) ? t.tags : [],
          category: t.category,
          usage_count: t.usage_count || 0,
          vote_count: t.vote_count || 0,
          created_by: t.created_by,
          is_system_template: t.is_system_template || false,
        }))
        setCommunityTemplates(formattedTemplates)
      } else {
        setCommunityTemplates([])
      }
    } catch (error) {
      console.error('[Bibliothèque Communautaire] Erreur:', error)
      setCommunityTemplates([])
    } finally {
      setLoadingCommunity(false)
    }
  }

  // Importer un modèle communautaire
  const importCommunityTemplate = async (template: {
    id: string
    pathologie: string
    questions: any[]
    title?: string
  }) => {
    try {
      setPathology(template.pathologie)

      const formattedQuestions = template.questions.map((q: any) => {
        if (typeof q === 'string') {
          return q
        }
        if (q && (q.question || q.text)) {
          return q.question || q.text
        }
        return ''
      }).filter((q: string) => q.trim() !== '')

      setQuestions(formattedQuestions.length > 0 ? formattedQuestions : [''])

      try {
        const { supabase } = await import('@/lib/supabase') as any
        await supabase.rpc('increment_template_usage', { template_id: template.id })
        loadCommunityTemplates()
      } catch (err) {
        console.error('Erreur incrément usage:', err)
      }

      setTimeout(() => {
        const formElement = document.getElementById('questionnaire-form')
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)

      alert(`Modèle "${template.title || template.pathologie}" importé ! Vous pouvez maintenant le modifier et l'enregistrer.`)
    } catch (err: any) {
      console.error('Erreur import modèle:', err)
      alert('Erreur lors de l\'import du modèle')
    }
  }

  // Partager un modèle avec la communauté
  const shareToCommunity = async (questionnaireId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Vous devez être connecté')
        return
      }

      const { data: questionnaire, error: fetchError } = await supabase
        .from('questionnaires')
        .select('pathologie, questions')
        .eq('id', questionnaireId)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !questionnaire) {
        throw new Error('Questionnaire introuvable')
      }

      const title = prompt('Titre du modèle (ex: "Premier Bilan", "Suivi de Douleur"):', questionnaire.pathologie)
      if (!title) return

      const description = prompt('Description (optionnel):', '')
      const category = prompt('Catégorie (ex: "Premier Bilan", "Suivi de Douleur", "Satisfaction Globale"):', '')
      const tagsInput = prompt('Tags séparés par des virgules (ex: "#Satisfaction, #Suivi, #Douleur, #Kiné, #Podologue"):\n\nTags disponibles: #Satisfaction, #Suivi, #Douleur, #Kiné, #Podologue, #Bien-être, #Évolution', '')

      // Nettoyer et formater les tags (ajouter # si manquant)
      const tags = tagsInput
        ? tagsInput.split(',').map(t => {
          const trimmed = t.trim()
          return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
        }).filter(t => t.length > 1)
        : []

      const { error: insertError } = await supabase
        .from('community_templates')
        .insert({
          title: title.trim(),
          description: description?.trim() || null,
          pathologie: questionnaire.pathologie,
          questions: questionnaire.questions,
          tags: tags,
          category: category?.trim() || null,
          created_by: user.id,
          is_approved: false,
        })

      if (insertError) {
        if (insertError.code === '42P01') {
          alert('La table community_templates n\'existe pas. Exécutez supabase-community-templates.sql')
          return
        }
        throw insertError
      }

      alert('Modèle partagé avec succès ! Il sera visible après modération par un administrateur.')
    } catch (err: any) {
      console.error('Erreur partage communautaire:', err)
      alert('Erreur lors du partage du modèle: ' + (err.message || 'Erreur inconnue'))
    }
  }

  // Voter pour un modèle communautaire
  const voteForTemplate = async (templateId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase') as any
      await supabase.rpc('increment_template_vote', { template_id: templateId })
      loadCommunityTemplates()
    } catch (err: any) {
      console.error('Erreur vote:', err)
    }
  }

  useEffect(() => {
    loadTemplates()
    loadAvailablePathologies()
    loadFavoriteModels()
    loadCommunityTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recharger les modèles communautaires quand les filtres changent
  useEffect(() => {
    if (activeTab === 'community') {
      loadCommunityTemplates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCategory, selectedTag])

  // Charger les pathologies disponibles depuis la table questionnaires
  const loadAvailablePathologies = async () => {
    try {
      setLoadingPathologies(true)
      const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setAvailablePathologies([])
        return
      }

      // Récupérer toutes les pathologies uniques avec leurs questions depuis questionnaires
      const { data, error } = await supabase
        .from('questionnaires')
        .select('pathologie, questions, id')
        .eq('user_id', user.id)
        .not('pathologie', 'is', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Envoi Instantané] Erreur chargement pathologies:', error)
        // Si la table n'existe pas, on continue sans erreur
        if (error.code === '42P01') {
          console.warn('Table questionnaires non créée. Continuer sans pathologies.')
        }
        setAvailablePathologies([])
        return
      }

      if (data && data.length > 0) {
        // Grouper par pathologie et garder la version la plus récente de chaque pathologie
        const pathologyMap = new Map<string, { pathologie: string; questions: any[]; id?: string }>()

        data.forEach((q: any) => {
          const pathologie = q.pathologie?.trim()
          if (pathologie && !pathologyMap.has(pathologie)) {
            pathologyMap.set(pathologie, {
              pathologie,
              questions: Array.isArray(q.questions) ? q.questions : [],
              id: q.id,
            })
          }
        })

        const uniquePathologies = Array.from(pathologyMap.values())
        setAvailablePathologies(uniquePathologies)
      } else {
        setAvailablePathologies([])
      }
    } catch (error) {
      console.error('[Envoi Instantané] Erreur:', error)
      setAvailablePathologies([])
    } finally {
      setLoadingPathologies(false)
    }
  }

  // Sauvegarder un template dans Supabase
  const saveTemplate = async (pathologieName: string, questionsList: string[], updateExisting: boolean = false) => {
    try {
      const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Vous devez être connecté pour sauvegarder un modèle')
        return false
      }

      const questionsJson = questionsList.filter(q => q.trim())

      if (updateExisting && existingTemplateId) {
        // Mettre à jour un template existant
        const { error } = await supabase
          .from('templates')
          .update({
            pathologie_name: pathologieName.trim(),
            questions: questionsJson,
          })
          .eq('id', existingTemplateId)
          .eq('user_id', user.id)

        if (error) throw error
        alert('Modèle mis à jour avec succès')
      } else {
        // Vérifier si un template existe déjà pour cette pathologie
        const { data: existing } = await supabase
          .from('templates')
          .select('id')
          .eq('user_id', user.id)
          .eq('pathologie_name', pathologieName.trim())
          .single()

        if (existing) {
          // Template existe déjà, mettre à jour automatiquement
          const { error: updateError } = await supabase
            .from('templates')
            .update({
              pathologie_name: pathologieName.trim(),
              questions: questionsJson,
            })
            .eq('id', existing.id)
            .eq('user_id', user.id)

          if (updateError) throw updateError
          // Pas d'alerte pour la mise à jour automatique
          await loadTemplates()
          return true
        }

        // Créer un nouveau template
        const { error } = await supabase
          .from('templates')
          .insert({
            user_id: user.id,
            pathologie_name: pathologieName.trim(),
            questions: questionsJson,
          })

        if (error) throw error
        alert('Modèle sauvegardé avec succès')
      }

      await loadTemplates()
      return true
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du template:', error)
      alert(`Erreur lors de la sauvegarde: ${error.message}`)
      return false
    }
  }

  // Charger un template depuis Supabase
  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setPathology(template.pathologie_name)
      setQuestions(template.questions.length > 0 ? template.questions : [''])
    }
  }

  // Charger les questionnaires
  const loadQuestionnaires = async () => {
    try {
      console.log('[Dashboard] Chargement des questionnaires...')
      const response = await fetch('/api/questionnaire')
      if (response.ok) {
        const data = await response.json()
        console.log('[Dashboard] Questionnaires reçus:', data.questionnaires.length)
        console.log('[Dashboard] Détails:', data.questionnaires.map((q: any) => ({ id: q.id, title: q.title })))
        setQuestionnaires(data.questionnaires)
      } else {
        console.error('[Dashboard] Erreur lors du chargement:', response.status)
      }
    } catch (error) {
      console.error('[Dashboard] Erreur lors du chargement des questionnaires:', error)
    }
  }

  useEffect(() => {
    console.log('[Dashboard] useEffect: Chargement initial des questionnaires')
    loadQuestionnaires()
    const interval = setInterval(loadQuestionnaires, 5000) // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval)
  }, [])

  // Gérer la sélection de pathologie (modèles par défaut ou personnalisés)
  // Note: Cette fonction est conservée pour compatibilité avec le gestionnaire de modèles
  const handlePathologyChange = (pathologyId: string) => {
    setSelectedPathology(pathologyId)

    if (pathologyId) {
      // Vérifier si c'est un modèle personnalisé (commence par "custom_")
      if (pathologyId.startsWith('custom_')) {
        const customModel = customModels.find(m => m.id === pathologyId)
        if (customModel) {
          setPathology(customModel.name)
          setQuestions(customModel.questions.map(q => q.question))
        }
      } else {
        // Modèle par défaut
        const model = getPathologyModel(pathologyId)
        if (model) {
          setPathology(model.name)
          setQuestions(model.questions.map(q => q.question))
        }
      }
    } else {
      // Réinitialiser si aucune pathologie
      setPathology('')
      setQuestions([''])
    }
  }

  // Gérer la création/sauvegarde d'un modèle personnalisé
  const handleSaveModel = () => {
    if (!newModelName.trim()) {
      alert('Veuillez donner un nom au modèle')
      return
    }

    if (newModelQuestions.filter(q => q.question && q.question.trim().length > 0).length === 0) {
      alert('Veuillez ajouter au moins une question')
      return
    }

    try {
      const modelData = {
        name: newModelName.trim(),
        description: newModelDescription.trim(),
        questions: newModelQuestions.filter(q => q.question && q.question.trim().length > 0),
      }

      if (editingModel) {
        // Mise à jour d'un modèle existant (on supprime et recrée pour simplifier)
        deleteCustomModel(editingModel.id)
        saveCustomModel(modelData)
      } else {
        // Création d'un nouveau modèle
        saveCustomModel(modelData)
      }

      setCustomModels(getCustomModels())
      setNewModelName('')
      setNewModelDescription('')
      setNewModelQuestions([])
      setEditingModel(null)
      alert('Modèle sauvegardé avec succès')
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    }
  }

  // Gérer l'export des modèles
  const handleExportModels = () => {
    try {
      const json = exportModels()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `medilink_modeles_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      alert('Modèles exportés avec succès')
    } catch (error: any) {
      alert(`Erreur lors de l'export: ${error.message}`)
    }
  }

  // Gérer l'import des modèles
  const handleImportModels = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const result = importModels(json)
        setCustomModels(getCustomModels())

        if (result.errors.length > 0) {
          alert(`Import terminé: ${result.success} modèle(s) importé(s). Erreurs: ${result.errors.join(', ')}`)
        } else {
          alert(`${result.success} modèle(s) importé(s) avec succès`)
        }
      } catch (error: any) {
        alert(`Erreur lors de l'import: ${error.message}`)
      }
    }
    reader.readAsText(file)
    // Réinitialiser l'input
    event.target.value = ''
  }

  // Tester le lien Google Review
  const handleTestLink = () => {
    const urlToTest = googleReviewUrl.trim()

    // Vérifier si le champ est vide
    if (!urlToTest) {
      alert('Veuillez saisir un lien d\'abord')
      return
    }

    // Vérifier et ajouter http:// ou https:// si nécessaire
    let finalUrl = urlToTest
    if (!urlToTest.startsWith('http://') && !urlToTest.startsWith('https://')) {
      finalUrl = `https://${urlToTest}`
    }

    // Ouvrir le lien dans un nouvel onglet
    window.open(finalUrl, '_blank', 'noopener,noreferrer')
  }

  const addQuestion = () => {
    setQuestions([...questions, ''])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[index] = value
    setQuestions(newQuestions)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!pathology.trim()) {
      alert('Veuillez saisir une pathologie')
      return
    }

    if (questions.filter(q => q.trim()).length === 0) {
      alert('Veuillez ajouter au moins une question')
      return
    }

    // Si un email est fourni, valider le délai
    if (patientEmail.trim()) {
      if (!sendDelayDays || sendDelayDays < 1) {
        alert('Veuillez saisir un nombre de jours valide (minimum 1)')
        return
      }
    }

    setLoading(true)

    try {
      // Récupérer l'ID utilisateur pour la sauvegarde Supabase
      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null

      // 1. Créer le questionnaire
      const response = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: pathology.trim(), // Utiliser la pathologie comme titre
          questions: questions
            .filter(q => q.trim())
            .map(q => ({
              question: q.trim(),
              type: 'scale' as const,
              label1: 'Pas du tout',
              label5: 'Énormément',
            })),
          isScheduled: patientEmail.trim().length > 0, // Envoi programmé si un email est fourni
          pathologyId: undefined,
          pathologyName: pathology.trim(),
          googleReviewUrl: googleReviewUrl.trim() || undefined,
          // Données pour l'envoi programmé (préparé pour intégration Resend/Supabase Edge)
          patientEmail: patientEmail.trim() || undefined,
          sendDelayDays: patientEmail.trim() ? sendDelayDays : undefined, // Envoyer le délai si un email est fourni
          userId: userId, // Ajouter l'ID utilisateur pour Supabase
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création')
      }
      const data = await response.json()
      setGeneratedLink(data.link)
      setGeneratedQuestionnaireId(data.id)

      // 2. Si l'envoi est programmé, appeler l'API de planification
      if (isScheduled && patientEmail.trim() && sendDelayDays) {
        try {
          // Calculer la date d'envoi à partir du nombre de jours
          const sendDate = new Date()
          sendDate.setDate(sendDate.getDate() + sendDelayDays)
          const sendDateISO = sendDate.toISOString()

          const scheduleResponse = await fetch('/api/schedule-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              questionnaireId: data.id,
              email: patientEmail.trim(),
              sendDate: sendDateISO,
            }),
          })

          if (!scheduleResponse.ok) {
            const error = await scheduleResponse.json()
            throw new Error(error.error || 'Erreur lors de la programmation')
          }

          const scheduleData = await scheduleResponse.json()

          if (scheduleData.success) {
            const formattedDate = new Date(sendDateISO).toLocaleString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
            setScheduledEmailInfo(`E-mail programmé avec succès pour le ${formattedDate}. Aucune donnée patient n'est conservée localement.`)
          }
        } catch (scheduleError: any) {
          alert(`Questionnaire créé mais erreur lors de la programmation: ${scheduleError.message}`)
        }
      }

      // 3. Sauvegarder automatiquement comme template (non bloquant)
      // On sauvegarde en arrière-plan sans bloquer l'utilisateur
      saveTemplate(pathology.trim(), questions.filter(q => q.trim()), false).catch((templateError) => {
        console.error('Erreur lors de la sauvegarde du template:', templateError)
        // On continue même si la sauvegarde du template échoue
      })

      setPathology('')
      setQuestions([''])
      setSelectedPathology('')
      setScheduledEmailInfo(null)
      setPatientEmail('')
      setSendDelayDays(14) // Réinitialiser à la valeur par défaut
      loadQuestionnaires()
      // Recharger les pathologies disponibles pour l'envoi instantané
      loadAvailablePathologies()
    } catch (error) {
      alert('Erreur lors de la création du questionnaire')
    } finally {
      setLoading(false)
    }
  }


  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      alert('Lien copié dans le presse-papiers')
    }
  }

  const viewResponse = async (id: string) => {
    try {
      const response = await fetch(`/api/responses/${id}`)
      if (response.ok) {
        const data = await response.json()
        setResponseData(data)
        setSelectedQuestionnaire(id)
        loadQuestionnaires()
      } else {
        alert('Aucune réponse disponible')
      }
    } catch (error) {
      alert('Erreur lors de la récupération')
    }
  }

  const downloadResponse = (data: any) => {
    const content = `QUESTIONNAIRE: ${data.questionnaire.title}
Date de soumission: ${new Date(data.response.submittedAt).toLocaleString('fr-FR')}
Date de consultation: ${data.response.viewedAt ? new Date(data.response.viewedAt).toLocaleString('fr-FR') : 'Non consulté'}

QUESTIONS ET RÉPONSES:
${data.questionnaire.questions.map((q: any, i: number) => {
      const questionText = typeof q === 'string' ? q : q.question
      const answer = data.response.answers[i]
      const answerNum = typeof answer === 'number' ? answer : parseInt(String(answer)) || 0
      return `${i + 1}. ${questionText}\n   Réponse: ${answerNum > 0 ? `${answerNum}/5` : 'Non répondue'}\n`
    }).join('\n')}

---
Généré le: ${new Date().toLocaleString('fr-FR')}
⚠️ Ces données seront supprimées automatiquement après consultation.
`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `questionnaire_${data.questionnaire.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const deleteQuestionnaire = async (id: string) => {
    if (!confirm('Supprimer ce questionnaire et ses réponses ?')) return

    try {
      // Annuler l'envoi d'email programmé si existe
      const cancelResponse = await fetch(`/api/schedule-email?questionnaireId=${id}`, {
        method: 'DELETE',
      })
      // On continue même si l'annulation échoue

      // Supprimer le questionnaire
      const response = await fetch(`/api/responses/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadQuestionnaires()
        if (selectedQuestionnaire === id) {
          setSelectedQuestionnaire(null)
          setResponseData(null)
        }
        if (generatedQuestionnaireId === id) {
          setGeneratedLink(null)
          setGeneratedQuestionnaireId(null)
          setScheduledEmailInfo(null)
        }
      }
    } catch (error) {
      alert('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Questionnaires Éphémères</h1>
        <p className="text-gray-600 mt-2">Créez des formulaires pour vos patients</p>
      </div>

      {/* Section de Personnalisation du Modèle Standard */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Personnaliser votre questionnaire de suivi</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configurez les questions par défaut qui seront utilisées pour tous vos questionnaires
            </p>
          </div>
          <button
            onClick={() => setShowSettingsSection(!showSettingsSection)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm font-medium"
          >
            {showSettingsSection ? 'Masquer' : hasSettings ? 'Modifier' : 'Personnaliser'}
          </button>
        </div>

        {showSettingsSection && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {standardQuestions.map((question, index) => (
              <div key={question.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Question {index + 1}
                  </label>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                    {question.type === 'scale' && 'Échelle 1-5'}
                    {question.type === 'yesno' && 'Oui/Non'}
                    {question.type === 'text' && 'Texte libre'}
                  </span>
                </div>
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => {
                    const newQuestions = [...standardQuestions]
                    newQuestions[index] = { ...newQuestions[index], text: e.target.value }
                    setStandardQuestions(newQuestions)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Saisissez votre question..."
                />
              </div>
            ))}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowSettingsSection(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={saveQuestionnaireSettings}
                disabled={savingSettings}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Enregistrer le modèle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {!showSettingsSection && hasSettings && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Modèle personnalisé enregistré</span>
            </p>
          </div>
        )}
      </div>

      {/* Bibliothèque de Modèles */}
      {isMountedRef.current && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bibliothèque de Modèles</h2>
              <p className="text-sm text-gray-600 mt-1">Accès rapide à vos modèles et à ceux de la communauté</p>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'my'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              Mes Favoris
              {favoriteModels.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                  {favoriteModels.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('community')
                if (communityTemplates.length === 0) {
                  loadCommunityTemplates()
                }
              }}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'community'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Exploration Communautaire
            </button>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'my' ? (
            /* Mes Modèles Favoris */
            favoriteModels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteModels.map((model) => (
                  <div
                    key={model.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary transition-colors bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{model.pathologie}</h3>
                        <p className="text-xs text-gray-500">
                          {Array.isArray(model.questions) ? model.questions.length : 0} question{Array.isArray(model.questions) && model.questions.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleFavorite(model.id, model.is_favorite)}
                        className="text-yellow-500 hover:text-yellow-600 transition-colors p-1"
                        title="Retirer des favoris"
                      >
                        <Star className="w-5 h-5 fill-yellow-500" />
                      </button>
                    </div>
                    <button
                      onClick={() => loadFavoriteModel(model)}
                      className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Utiliser ce modèle</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Aucun modèle favori</p>
                <p className="text-sm text-gray-500">Marquez vos questionnaires comme favoris pour les retrouver ici</p>
              </div>
            )
          ) : (
            /* Modèles de la Communauté */
            <div>
              {/* Filtres par Tags - Badges cliquables */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filtrer par tags :</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTag('all')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTag === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                  >
                    Tout
                  </button>
                  {['#Kiné', '#Podologue', '#Ostéo', '#Satisfaction', '#Douleur', '#Post-Op', '#Sport', '#Bilan', '#Suivi', '#Pédiatrie'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTag === tag
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre par catégorie (optionnel, peut être masqué) */}
              <div className="mb-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">Toutes les catégories</option>
                  <option value="Premier Bilan">Premier Bilan</option>
                  <option value="Suivi de Douleur">Suivi de Douleur</option>
                  <option value="Satisfaction Globale">Satisfaction Globale</option>
                  <option value="Post-opératoire">Post-opératoire</option>
                  <option value="Bien-être">Bien-être</option>
                  <option value="Rééducation">Rééducation</option>
                </select>
              </div>

              {loadingCommunity ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : communityTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communityTemplates
                    .filter((template) => {
                      // Filtrer par tag sélectionné
                      if (selectedTag === 'all') return true
                      const templateTags = Array.isArray(template.tags) ? template.tags : []
                      if (templateTags.length === 0) return false // Masquer les modèles sans tags si un filtre est actif
                      // Vérifier si le tag est présent (avec ou sans #)
                      const tagToSearch = selectedTag.startsWith('#') ? selectedTag : `#${selectedTag}`
                      return templateTags.some((tag: string) =>
                        tag === tagToSearch || tag === selectedTag || tag === tagToSearch.replace('#', '')
                      )
                    })
                    .map((template) => (
                      <div
                        key={template.id}
                        className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary transition-colors bg-gray-50 relative"
                      >
                        {/* Badge Standard/Officiel pour les modèles système */}
                        {template.is_system_template && (
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-sm">
                              ✓ Standard
                            </span>
                          </div>
                        )}
                        <div className="mb-3">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 pr-16">{template.title}</h3>
                          </div>
                          {template.description && (
                            <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(Array.isArray(template.tags) ? template.tags : []).slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            {Array.isArray(template.questions) ? template.questions.length : 0} question{Array.isArray(template.questions) && template.questions.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>👥 {template.usage_count} utilisations</span>
                          <button
                            onClick={() => voteForTemplate(template.id)}
                            className="flex items-center space-x-1 hover:text-primary transition-colors"
                            title="Voter pour ce modèle"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{template.vote_count}</span>
                          </button>
                        </div>
                        <button
                          onClick={() => importCommunityTemplate(template)}
                          className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Importer dans mes modèles</span>
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Aucun modèle communautaire disponible</p>
                  <p className="text-sm text-gray-500">Les modèles partagés par la communauté apparaîtront ici</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bloc Envoi Instantané */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Envoi Instantané</h2>
            <p className="text-sm text-gray-600 mt-1">Envoyez un questionnaire immédiatement à un patient</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Menu déroulant pour choisir une pathologie */}
          <div>
            <label htmlFor="instantPathology" className="block text-sm font-medium text-gray-700 mb-2">
              Pathologie *
            </label>
            <select
              id="instantPathology"
              value={instantPathology}
              onChange={(e) => {
                setInstantPathology(e.target.value)
                setInstantError(null)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loadingPathologies || availablePathologies.length === 0 || sendingInstant}
            >
              <option value="">
                {loadingPathologies
                  ? 'Chargement...'
                  : availablePathologies.length === 0
                    ? 'Aucune pathologie disponible - Créez d\'abord un questionnaire'
                    : '-- Sélectionner une pathologie --'}
              </option>
              {availablePathologies.map((pathology, index) => (
                <option key={pathology.id || index} value={pathology.pathologie}>
                  {pathology.pathologie}
                </option>
              ))}
            </select>
            {availablePathologies.length === 0 && !loadingPathologies && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Créez d&apos;abord un questionnaire pour pouvoir l&apos;envoyer instantanément
              </p>
            )}
          </div>

          {/* Champ Email */}
          <div>
            <label htmlFor="instantEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email du patient *
            </label>
            <input
              id="instantEmail"
              type="email"
              value={instantEmail}
              onChange={(e) => {
                setInstantEmail(e.target.value)
                setInstantError(null)
              }}
              placeholder="patient@exemple.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={sendingInstant}
              required
            />
          </div>

          {/* Messages d'erreur/succès */}
          {instantError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{instantError}</p>
              </div>
            </div>
          )}

          {instantSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">{instantSuccess}</p>
              </div>
            </div>
          )}

          {/* Bouton Envoyer maintenant */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={async () => {
                if (!instantPathology) {
                  setInstantError('Veuillez sélectionner une pathologie')
                  return
                }

                if (!instantEmail || !instantEmail.includes('@')) {
                  setInstantError('Veuillez saisir une adresse email valide')
                  return
                }

                try {
                  setSendingInstant(true)
                  setInstantError(null)
                  setInstantSuccess(null)

                  // Récupérer la pathologie sélectionnée depuis les pathologies disponibles
                  const selectedPathologyData = availablePathologies.find(p => p.pathologie === instantPathology)
                  if (!selectedPathologyData) {
                    throw new Error('Pathologie introuvable')
                  }

                  // Récupérer les informations du praticien
                  const { supabase } = await import('@/lib/supabase') as any
                  const { data: { user } } = await supabase.auth.getUser()

                  if (!user) {
                    throw new Error('Vous devez être connecté')
                  }

                  // Récupérer le profil pour obtenir le nom du cabinet
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('nom_complet, cabinet, adresse_cabinet, email')
                    .eq('id', user.id)
                    .single()

                  const cabinetName = profile?.cabinet || 'Cabinet Médical'
                  const practitionerName = profile?.nom_complet || undefined
                  const cabinetEmail = profile?.email || undefined

                  // Récupérer les questions de la pathologie sélectionnée
                  const questionsArray = Array.isArray(selectedPathologyData.questions)
                    ? selectedPathologyData.questions
                    : []

                  // Convertir les questions en format attendu
                  const formattedQuestions = questionsArray.map((q: any) => {
                    if (typeof q === 'string') {
                      return {
                        question: q,
                        type: 'scale',
                        label1: 'Pas du tout',
                        label5: 'Énormément',
                      }
                    }
                    // Si c'est déjà un objet avec question/text
                    if (q && (q.question || q.text)) {
                      return {
                        question: q.question || q.text,
                        type: q.type || 'scale',
                        label1: q.label1 || 'Pas du tout',
                        label5: q.label5 || 'Énormément',
                      }
                    }
                    return q
                  })

                  // Créer le questionnaire via l'API
                  const createResponse = await fetch('/api/questionnaire', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      title: selectedPathologyData.pathologie,
                      questions: formattedQuestions.length > 0 ? formattedQuestions : [
                        {
                          question: 'Comment évaluez-vous votre amélioration depuis la séance ?',
                          type: 'scale',
                          label1: 'Pas du tout',
                          label5: 'Énormément',
                        }
                      ],
                      isScheduled: false, // Envoi immédiat, pas de programmation
                      pathologyName: selectedPathologyData.pathologie,
                      patientEmail: instantEmail.trim(),
                      userId: user.id,
                    }),
                  })

                  if (!createResponse.ok) {
                    const errorData = await createResponse.json()
                    throw new Error(errorData.error || 'Erreur lors de la création du questionnaire')
                  }

                  const questionnaireData = await createResponse.json()

                  // Envoyer l'email immédiatement
                  const emailResponse = await fetch('/api/send-followup-email', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      to: instantEmail.trim(),
                      patientName: instantEmail.split('@')[0], // Extraire le nom depuis l'email
                      cabinetName,
                      sessionDate: new Date().toISOString(),
                      questionnaireId: questionnaireData.id,
                      practitionerName,
                      cabinetEmail,
                    }),
                  })

                  if (!emailResponse.ok) {
                    const errorData = await emailResponse.json()
                    throw new Error(errorData.error || 'Erreur lors de l\'envoi de l\'email')
                  }

                  // Succès !
                  setInstantSuccess(`Questionnaire envoyé avec succès à ${instantEmail}`)

                  // Réinitialiser les champs après 3 secondes
                  setTimeout(() => {
                    setInstantPathology('')
                    setInstantEmail('')
                    setInstantSuccess(null)
                  }, 3000)

                  // Recharger les questionnaires pour mettre à jour le dashboard
                  loadQuestionnaires()
                  // Recharger les pathologies disponibles au cas où une nouvelle serait ajoutée
                  loadAvailablePathologies()
                } catch (err: any) {
                  console.error('Erreur envoi instantané:', err)
                  setInstantError(err.message || 'Erreur lors de l\'envoi du questionnaire')
                } finally {
                  setSendingInstant(false)
                }
              }}
              disabled={sendingInstant || !instantPathology || !instantEmail || availablePathologies.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingInstant ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Envoyer maintenant</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Avertissement */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 mb-1">
              Données éphémères
            </h3>
            <p className="text-xs text-yellow-700">
              Les questionnaires et réponses sont stockés uniquement en mémoire et supprimés automatiquement après consultation ou dans 2 heures maximum.
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire de création */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Créer un questionnaire</h2>

        <form id="questionnaire-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Dropdown pour charger une pathologie existante */}
          <div>
            <label htmlFor="loadTemplate" className="block text-sm font-medium text-gray-700 mb-2">
              Charger une pathologie existante
            </label>
            <select
              id="loadTemplate"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  loadTemplate(e.target.value)
                  e.target.value = '' // Réinitialiser le select
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loadingTemplates || templates.length === 0}
            >
              <option value="">
                {loadingTemplates
                  ? 'Chargement...'
                  : templates.length === 0
                    ? 'Aucune pathologie sauvegardée'
                    : '-- Sélectionner une pathologie --'}
              </option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.pathologie_name}
                </option>
              ))}
            </select>
          </div>

          {/* Champ Pathologie avec auto-complétion */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="pathology" className="block text-sm font-medium text-gray-700">
                Pathologie *
              </label>
              <button
                type="button"
                onClick={async () => {
                  if (!pathology.trim()) {
                    alert('Veuillez saisir une pathologie d\'abord')
                    return
                  }
                  if (questions.filter(q => q.trim()).length === 0) {
                    alert('Veuillez ajouter au moins une question')
                    return
                  }
                  await saveTemplate(pathology.trim(), questions.filter(q => q.trim()), false)
                }}
                className="text-xs text-primary hover:text-primary-dark font-medium flex items-center space-x-1"
              >
                <Save className="w-3 h-3" />
                <span>Enregistrer comme modèle par défaut</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="pathology"
                type="text"
                value={pathology}
                onChange={(e) => {
                  setPathology(e.target.value)
                  // Auto-complétion : filtrer les suggestions
                  const value = e.target.value.toLowerCase()
                  if (value.length > 0) {
                    const filtered = pathologySuggestions.filter(p =>
                      p.toLowerCase().includes(value)
                    )
                    // Les suggestions sont déjà dans pathologySuggestions
                  }
                }}
                list="pathology-suggestions"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Suivi post-opératoire, Suivi diabète, Kinésithérapie..."
              />
              <datalist id="pathology-suggestions">
                {pathologySuggestions.map((suggestion, index) => (
                  <option key={index} value={suggestion} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Section Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Questions *
            </label>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    placeholder="Saisissez votre question ici..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title="Supprimer cette question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="mt-3 flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajouter une question</span>
            </button>
          </div>

          {/* Champ Email du patient */}
          <div>
            <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email du patient
            </label>
            <input
              id="patientEmail"
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="exemple@patient.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Lien Google Review */}
          <div>
            <label htmlFor="googleReviewUrl" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <span>Lien de redirection (ex: Google Review)</span>
                <div className="relative">
                  <button
                    type="button"
                    onMouseEnter={() => setShowGoogleReviewTooltip(true)}
                    onMouseLeave={() => setShowGoogleReviewTooltip(false)}
                    onClick={() => setShowGoogleReviewTooltip(!showGoogleReviewTooltip)}
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  {/* Infobulle */}
                  {showGoogleReviewTooltip && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-80 z-50">
                      <div className="bg-gray-900 text-white text-xs rounded-lg p-4 shadow-xl relative">
                        {/* Triangle pointant vers le bas */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                        <p className="font-semibold mb-2">Comment obtenir votre lien direct :</p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-200">
                          <li>Allez sur votre fiche Google Business Profile</li>
                          <li>Choisissez &quot;Demander des avis&quot;</li>
                          <li>Copiez le lien court fourni</li>
                        </ol>
                        <p className="mt-2 text-gray-300">
                          Ce lien ouvrira directement la fenêtre de notation pour vos patients.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </label>
            <div className="flex items-start space-x-2">
              <input
                id="googleReviewUrl"
                type="url"
                value={googleReviewUrl}
                onChange={(e) => {
                  const newUrl = e.target.value
                  setGoogleReviewUrl(newUrl)
                  // Sauvegarder automatiquement dans LocalStorage
                  updateGoogleReviewUrl(newUrl)
                }}
                placeholder="https://g.page/r/..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={handleTestLink}
                className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-primary transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Tester le lien</span>
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Si renseigné, les patients avec une moyenne ≥ 4.5/5 seront redirigés vers ce lien après soumission. Le lien est sauvegardé automatiquement.
            </p>
            <p className="mt-1 text-xs text-gray-400 italic">
              Cliquez sur &quot;Tester le lien&quot; pour vérifier que vos patients seront bien redirigés vers la bonne page.
            </p>
          </div>

          {/* Délai d'envoi personnalisé */}
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm text-gray-700">Programmer l&apos;envoi automatique de l&apos;email dans :</span>
            <input
              type="number"
              min="1"
              max="365"
              value={sendDelayDays}
              onChange={(e) => {
                const days = parseInt(e.target.value) || 14
                setSendDelayDays(days)
                // Mettre à jour la date automatiquement
                const newDate = new Date()
                newDate.setDate(newDate.getDate() + days)
                setSendDate(newDate.toISOString().split('T')[0])
              }}
              className="max-w-[80px] w-16 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center font-medium text-sm"
            />
            <span className="text-sm text-gray-700">jours</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Création en cours...</span>
              </span>
            ) : (
              'Créer le questionnaire'
            )}
          </button>
        </form>

        {/* Lien généré */}
        {generatedLink && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">Lien généré avec succès</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Confirmation d'envoi programmé */}
            {scheduledEmailInfo && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800">{scheduledEmailInfo}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Liste des questionnaires */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Questionnaires créés</h2>

        {questionnaires.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun questionnaire créé</p>
        ) : (
          <div className="space-y-4">
            {questionnaires.map((q) => (
              <div
                key={q.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{q.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {q.questionCount} question(s) • Créé le {new Date(q.createdAt).toLocaleString('fr-FR')}
                    </p>
                    {q.hasResponse && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${q.responseViewed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                          }`}>
                          {q.responseViewed ? '✓ Consulté' : 'Nouvelle réponse'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {q.hasResponse && !q.responseViewed && (
                      <button
                        onClick={() => viewResponse(q.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Voir réponse</span>
                      </button>
                    )}
                    {q.hasResponse && q.responseViewed && (
                      <button
                        onClick={() => viewResponse(q.id)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Voir</span>
                      </button>
                    )}
                    <button
                      onClick={() => shareToCommunity(q.id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-sm flex items-center space-x-1"
                      title="Partager avec la communauté"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteQuestionnaire(q.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de réponse */}
      {responseData && selectedQuestionnaire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Réponse au questionnaire</h2>
              <button
                onClick={() => {
                  setResponseData(null)
                  setSelectedQuestionnaire(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {responseData.questionnaire.title}
                </h3>
                <p className="text-sm text-gray-600">
                  Soumis le {new Date(responseData.response.submittedAt).toLocaleString('fr-FR')}
                </p>
              </div>

              <div className="space-y-4">
                {responseData.questionnaire.questions.map((question: any, index: number) => {
                  const questionText = typeof question === 'string' ? question : question.question
                  const answer = responseData.response.answers[index]
                  const answerNum = typeof answer === 'number' ? answer : parseInt(String(answer)) || 0

                  // Couleur selon la valeur (1 = vert, 5 = rouge)
                  const getBadgeColor = (value: number) => {
                    if (value === 1) return 'bg-green-100 text-green-800 border-green-300'
                    if (value === 2) return 'bg-green-50 text-green-700 border-green-200'
                    if (value === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    if (value === 4) return 'bg-orange-100 text-orange-800 border-orange-300'
                    if (value === 5) return 'bg-red-100 text-red-800 border-red-300'
                    return 'bg-gray-100 text-gray-600 border-gray-300'
                  }

                  return (
                    <div key={index} className="border-b border-gray-200 pb-4">
                      <p className="font-medium text-gray-900 mb-3">
                        {index + 1}. {questionText}
                      </p>
                      {answerNum > 0 ? (
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg border-2 ${getBadgeColor(answerNum)}`}>
                            {answerNum}
                          </span>
                          <span className="text-sm text-gray-600">
                            sur 5
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Non répondue</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => downloadResponse(responseData)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Télécharger</span>
              </button>
              <button
                onClick={() => {
                  setResponseData(null)
                  setSelectedQuestionnaire(null)
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              ⚠️ Cette réponse sera supprimée automatiquement dans 1 minute après consultation
            </p>
          </div>
        </div>
      )}

      {/* Modal de confirmation pour mise à jour template existant */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Modèle existant trouvé
            </h2>
            <p className="text-gray-600 mb-6">
              Un modèle existe déjà pour la pathologie &quot;{pathology}&quot;. Que souhaitez-vous faire ?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  await saveTemplate(pathology.trim(), questions.filter(q => q.trim()), true)
                  setShowSaveTemplateModal(false)
                  setExistingTemplateId(null)
                }}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                Mettre à jour
              </button>
              <button
                onClick={async () => {
                  // Créer un nouveau modèle avec un nom différent
                  const newName = `${pathology} (${new Date().toLocaleDateString('fr-FR')})`
                  await saveTemplate(newName, questions.filter(q => q.trim()), false)
                  setShowSaveTemplateModal(false)
                  setExistingTemplateId(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Créer nouveau
              </button>
              <button
                onClick={() => {
                  setShowSaveTemplateModal(false)
                  setExistingTemplateId(null)
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des modèles personnalisés */}
      {showModelManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Mes Modèles Personnalisés</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportModels}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter</span>
                </button>
                <label className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Importer</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportModels}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => {
                    setShowModelManager(false)
                    setEditingModel(null)
                    setNewModelName('')
                    setNewModelDescription('')
                    setNewModelQuestions([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Liste des modèles existants */}
            {customModels.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Modèles sauvegardés</h3>
                <div className="space-y-2">
                  {customModels.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{model.name}</h4>
                        {model.description && (
                          <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {model.questions.length} question(s)
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingModel(model)
                            setNewModelName(model.name)
                            setNewModelDescription(model.description || '')
                            setNewModelQuestions([...model.questions])
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-sm"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer le modèle "${model.name}" ?`)) {
                              deleteCustomModel(model.id)
                              setCustomModels(getCustomModels())
                            }
                          }}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulaire de création/édition */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingModel ? 'Modifier le modèle' : 'Créer un nouveau modèle'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du modèle *
                  </label>
                  <input
                    type="text"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="Ex: Suivi Entorse, Bilan Anxiété..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnel)
                  </label>
                  <input
                    type="text"
                    value={newModelDescription}
                    onChange={(e) => setNewModelDescription(e.target.value)}
                    placeholder="Description du modèle..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Questions *
                  </label>
                  <div className="space-y-4">
                    {newModelQuestions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={question.question}
                            onChange={(e) => {
                              const newQuestions = [...newModelQuestions]
                              newQuestions[index] = { ...newQuestions[index], question: e.target.value, type: 'scale' }
                              setNewModelQuestions(newQuestions)
                            }}
                            placeholder={`Question ${index + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          />
                          {newModelQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewModelQuestions(newModelQuestions.filter((_, i) => i !== index))
                              }}
                              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Configuration des libellés pour l'échelle 1-5 */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-gray-600 mb-1">Libellé valeur 1 (optionnel)</label>
                            <input
                              type="text"
                              placeholder="Ex: Pas du tout"
                              value={question.label1 || ''}
                              onChange={(e) => {
                                const newQuestions = [...newModelQuestions]
                                newQuestions[index] = { ...newQuestions[index], label1: e.target.value }
                                setNewModelQuestions(newQuestions)
                              }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 mb-1">Libellé valeur 5 (optionnel)</label>
                            <input
                              type="text"
                              placeholder="Ex: Énormément"
                              value={question.label5 || ''}
                              onChange={(e) => {
                                const newQuestions = [...newModelQuestions]
                                newQuestions[index] = { ...newQuestions[index], label5: e.target.value }
                                setNewModelQuestions(newQuestions)
                              }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Le patient répondra sur une échelle de 1 à 5
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewModelQuestions([...newModelQuestions, {
                        question: '',
                        type: 'scale',
                      }])
                    }}
                    className="mt-2 flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une question</span>
                  </button>
                </div>

                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleSaveModel}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingModel ? 'Mettre à jour' : 'Sauvegarder le modèle'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingModel(null)
                      setNewModelName('')
                      setNewModelDescription('')
                      setNewModelQuestions([])
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

