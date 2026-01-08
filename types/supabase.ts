export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            questionnaires: {
                Row: {
                    id: string
                    created_at: string
                    user_id?: string
                    pathologie?: string
                    statut?: string
                    status?: string
                    questions?: any
                    reponses?: any
                    score_resultat?: number
                    patient_email?: string | null
                    patient_name?: string | null
                    send_after_days?: number
                    updated_at?: string
                    [key: string]: any
                }
                Insert: {
                    [key: string]: any
                }
                Update: {
                    [key: string]: any
                }
                Relationships: [
                    {
                        foreignKeyName: "questionnaires_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            responses: {
                Row: {
                    [key: string]: any
                }
                Insert: {
                    [key: string]: any
                }
                Update: {
                    [key: string]: any
                }
            }
            profiles: {
                Row: {
                    [key: string]: any
                }
                Insert: {
                    [key: string]: any
                }
                Update: {
                    [key: string]: any
                }
            }
            notifications: {
                Row: {
                    id: string
                    created_at: string
                    message: string
                    is_read: boolean
                    type: string
                    user_id?: string
                }
                Insert: {
                    [key: string]: any
                }
                Update: {
                    [key: string]: any
                }
            }
        }
        Views: {
            [key: string]: {
                Row: {
                    [key: string]: any
                }
            }
        }
        Functions: {
            [key: string]: {
                Args: {
                    [key: string]: any
                }
                Returns: any
            }
        }
        Enums: {
            [key: string]: any
        }
    }
}
