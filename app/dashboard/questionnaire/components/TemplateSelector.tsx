"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FolderOpen, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast'; // Adapted from sonner to react-hot-toast

interface TemplateSelectorProps {
    currentQuestions: any[];
    onLoadTemplate: (questions: any[]) => void;
}

export default function TemplateSelector({ currentQuestions, onLoadTemplate }: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Charger les modèles au montage
    useEffect(() => {
        fetchTemplates();
    }, []);

    async function fetchTemplates() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('questionnaire_templates')
            .select('*')
            .eq('user_id', user.id)
            .order('is_favorite', { ascending: false })
            .order('name', { ascending: true });

        if (error) {
            console.error(error)
            toast.error("Erreur lors du chargement des modèles");
        }
        else setTemplates(data || []);
        setLoading(false);
    }

    const handleSaveAsTemplate = async () => {
        const name = prompt("Nom du nouveau modèle :");
        if (!name) return;

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Utilisateur non connecté");

            const questionData = currentQuestions.map(q => ({
                question: q,
                type: 'scale'
            }))

            const { error } = await supabase
                .from('questionnaire_templates')
                .insert([{
                    name,
                    questions: questionData,
                    user_id: user.id
                }]);

            if (error) throw error;
            toast.success("Modèle enregistré avec succès !");
            fetchTemplates();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <FolderOpen className="text-blue-600 w-5 h-5" />
                <select
                    disabled={loading}
                    onChange={(e) => {
                        const template = templates.find(t => t.id === e.target.value);
                        if (template) {
                            // Adapter format questions si besoin (obj vs string)
                            const questions = template.questions.map((q: any) => typeof q === 'string' ? q : q.question)
                            onLoadTemplate(questions);
                            toast.success(`Modèle "${template.name}" chargé`);
                        }
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">{loading ? "Chargement..." : "Charger un modèle existant..."}</option>
                    {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.is_favorite ? "⭐ " : ""}{t.name}
                        </option>
                    ))}
                </select>
            </div>

            <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={saving || currentQuestions.length === 0 || (currentQuestions.length === 1 && !currentQuestions[0])}
                className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-green-600" />}
                Enregistrer l&apos;actuel comme modèle
            </button>
        </div>
    );
}
