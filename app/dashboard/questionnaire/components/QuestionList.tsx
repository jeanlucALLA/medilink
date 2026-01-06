import { Trash2, Plus, GripVertical } from 'lucide-react'

interface QuestionListProps {
    questions: string[]
    onUpdate: (index: number, value: string) => void
    onAdd: () => void
    onRemove: (index: number) => void
}

export function QuestionList({ questions, onUpdate, onAdd, onRemove }: QuestionListProps) {
    return (
        <div className="space-y-4">
            {questions.map((q, index) => (
                <div key={index} className="flex items-center space-x-2 group">
                    <div className="text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={q}
                            onChange={(e) => onUpdate(index, e.target.value)}
                            placeholder={`Question ${index + 1}`}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                        />
                    </div>
                    {questions.length > 1 && (
                        <button
                            onClick={() => onRemove(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer la question"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            ))}

            <button
                onClick={onAdd}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary hover:bg-blue-50 transition-all group"
            >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Ajouter une question</span>
            </button>
        </div>
    )
}
