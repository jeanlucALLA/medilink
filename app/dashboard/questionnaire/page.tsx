'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase' // Using shared client
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'
import {
  FileText,
  Send,
  Loader2,
  Copy,
  CheckCircle,
  History
} from 'lucide-react'

// Modular Components
import TemplateSelector from './components/TemplateSelector'
import { QuestionList } from './components/QuestionList'
import { EmailSendingSection } from './components/EmailSendingSection'

export default function QuestionnairePage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [practitionerProfile, setPractitionerProfile] = useState<any>(null)
  const router = useRouter()

  // Form State
  const [pathology, setPathology] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])

  // Email & Scheduling State
  const [patientEmail, setPatientEmail] = useState('')
  const [sendImmediately, setSendImmediately] = useState(false)
  const [sendDelayDays, setSendDelayDays] = useState(14)

  // Result State
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create')

  // Initial Load
  useEffect(() => {
    const init = async () => {
      console.log('Invoking getUser from page...')
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        console.error('Auth error or no user:', error)
        try {
          // Fallback: try getSession if getUser fails (sometimes locally more robust)
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            console.log('Recovered session via getSession')
            setUser(session.user)
            fetchProfile(session.user.id)
            return
          }
        } catch (err) { console.error(err) }

        router.push('/login')
        return
      }
      setUser(user)
      fetchProfile(user.id)
    }
    init()
  }, [router])

  const fetchProfile = async (userId: string) => {
    // Fetch profile for practitioner name in UI
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, nom_complet')
      .eq('id', userId)
      .single()

    setPractitionerProfile(profile)
  }

  const handleSubmit = async () => {
    // 1. Validation
    if (!pathology.trim()) {
      toast.error('Veuillez saisir un titre (Pathologie)')
      return
    }
    const cleanQuestions = questions.filter(q => q.trim())
    if (cleanQuestions.length === 0) {
      toast.error('Veuillez ajouter au moins une question')
      return
    }

    setLoading(true)
    setGeneratedLink(null)

    try {
      // 2. Create Questionnaire directly in Supabase
      const { data: questionnaire, error: createError } = await supabase
        .from('questionnaires')
        .insert({
          user_id: user.id,
          pathologie: pathology.trim(),
          questions: cleanQuestions.map(q => ({
            question: q,
            type: 'scale',
            label1: 'Pas du tout',
            label5: 'Énormément'
          })),
          title: pathology.trim(), // Mapping pathology to title as fallback
          patient_email: patientEmail.trim() || null,
          statut: sendImmediately ? 'envoyé' : 'en_attente'
        })
        .select()
        .single()

      if (createError) {
        console.error('Supabase Error:', createError)
        throw new Error('Erreur lors de la création du questionnaire')
      }

      // Generate Link
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const link = `${baseUrl}/q/${questionnaire.id}`
      setGeneratedLink(link)

      // 3. Handle Email Sending (if email provided)
      if (patientEmail.trim()) {
        try {
          const response = await fetch('/api/send-followup-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              patientEmail: patientEmail.trim(),
              questionnaireId: questionnaire.id,
              sendDelayDays: sendImmediately ? 0 : sendDelayDays
            })
          })

          if (!response.ok) {
            const result = await response.json()
            console.error('Email error:', result.error)
            // Ne pas bloquer : Warning seulement
            toast('Questionnaire créé, mais erreur d\'envoi email.', { icon: '⚠️' })
          } else {
            if (sendImmediately) {
              toast.success('Questionnaire créé et envoyé avec succès !')
            } else {
              toast.success('Questionnaire créé et envoi programmé !')
            }
          }
        } catch (emailErr) {
          console.error('Email network error:', emailErr)
          toast('Questionnaire créé, mais échec de la notification email.', { icon: '⚠️' })
        }
      } else {
        toast.success('Questionnaire créé avec succès !')
      }

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      toast.success('Lien copié !')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="bottom-right" />

      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Questionnaires</h1>
            <p className="text-gray-500 mt-1">Créez et envoyez des suivis à vos patients</p>
          </div>

          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'create' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <FileText className="w-4 h-4 inline-block mr-2" />
              Nouveau
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <History className="w-4 h-4 inline-block mr-2" />
              Historique
            </button>
          </div>
        </div>

        {activeTab === 'create' ? (
          <div className="space-y-6">

            {/* 1. Template Selector */}
            <TemplateSelector
              currentQuestions={questions}
              onLoadTemplate={(newQuestions) => setQuestions(newQuestions)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Editor */}
              <div className="lg:col-span-2 space-y-6">

                {/* 2. Questions Editor */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-primary" />
                    Personnalisation
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre du questionnaire / Pathologie *
                      </label>
                      <input
                        type="text"
                        value={pathology}
                        onChange={(e) => setPathology(e.target.value)}
                        placeholder="Ex: Suivi Post-Opératoire Hallux Valgus"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <QuestionList
                      questions={questions}
                      onUpdate={(idx, val) => {
                        const newQ = [...questions]
                        newQ[idx] = val
                        setQuestions(newQ)
                      }}
                      onAdd={() => setQuestions([...questions, ''])}
                      onRemove={(idx) => setQuestions(questions.filter((_, i) => i !== idx))}
                    />
                  </div>
                </div>

                {/* 3. Email & Scheduling Section */}
                <EmailSendingSection
                  patientEmail={patientEmail}
                  setPatientEmail={setPatientEmail}
                  sendImmediately={sendImmediately}
                  setSendImmediately={setSendImmediately}
                  sendDelayDays={sendDelayDays}
                  setSendDelayDays={setSendDelayDays}
                  practitionerName={practitionerProfile?.nom_complet || practitionerProfile?.full_name}
                />
              </div>

              {/* Right Column: Actions */}
              <div className="space-y-6">
                {/* Main Action Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Générer & Envoyer</span>
                    </>
                  )}
                </button>

                {/* Success / Link Display */}
                {generatedLink && (
                  <div className="bg-green-50 rounded-xl p-6 border border-green-100 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center space-x-2 text-green-800 font-semibold mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Questionnaire créé !</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white p-2 rounded border border-green-200">
                      <code className="text-xs text-green-700 flex-1 truncate">{generatedLink}</code>
                      <button onClick={copyLink} className="p-1 hover:bg-green-50 rounded text-green-600">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* History Placeholder */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-500">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Historique des questionnaires</h3>
            <p>Retrouvez ici la liste de tous les questionnaires envoyés et les réponses de vos patients.</p>
            <p className="text-xs mt-4">(Fonctionnalité d&apos;historique à intégrer prochainement)</p>
          </div>
        )}
      </div>
    </div>
  )
}
