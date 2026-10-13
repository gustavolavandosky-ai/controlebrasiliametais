export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      abastecimentos: {
        Row: {
          combustivel: string
          created_at: string
          data: string
          id: string
          km_atual: number | null
          litros: number
          motorista: string
          observacao: string
          updated_at: string
          user_id: string
          valor: number
          veiculo_id: string
        }
        Insert: {
          combustivel?: string
          created_at?: string
          data?: string
          id?: string
          km_atual?: number | null
          litros?: number
          motorista?: string
          observacao?: string
          updated_at?: string
          user_id: string
          valor?: number
          veiculo_id: string
        }
        Update: {
          combustivel?: string
          created_at?: string
          data?: string
          id?: string
          km_atual?: number | null
          litros?: number
          motorista?: string
          observacao?: string
          updated_at?: string
          user_id?: string
          valor?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abastecimentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      bag_movimentos: {
        Row: {
          cliente: string
          created_at: string
          data: string
          fornecedor: string
          id: string
          observacao: string
          quantidade: number
          quantidade_retornada: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente?: string
          created_at?: string
          data?: string
          fornecedor?: string
          id?: string
          observacao?: string
          quantidade?: number
          quantidade_retornada?: number
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente?: string
          created_at?: string
          data?: string
          fornecedor?: string
          id?: string
          observacao?: string
          quantidade?: number
          quantidade_retornada?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          created_at: string
          equipe: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipe?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipe?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      convites: {
        Row: {
          created_at: string
          criado_por: string
          email: string
          id: string
          updated_at: string
          usado_em: string | null
        }
        Insert: {
          created_at?: string
          criado_por: string
          email: string
          id?: string
          updated_at?: string
          usado_em?: string | null
        }
        Update: {
          created_at?: string
          criado_por?: string
          email?: string
          id?: string
          updated_at?: string
          usado_em?: string | null
        }
        Relationships: []
      }
      destinos: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      devolucoes: {
        Row: {
          created_at: string
          data: string
          empresa: string
          id: string
          material: string
          observacao: string
          quantidade_enviada: number
          quantidade_retornada: number
          unidade: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          empresa?: string
          id?: string
          material?: string
          observacao?: string
          quantidade_enviada?: number
          quantidade_retornada?: number
          unidade?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          empresa?: string
          id?: string
          material?: string
          observacao?: string
          quantidade_enviada?: number
          quantidade_retornada?: number
          unidade?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diarias: {
        Row: {
          colaborador: string
          created_at: string
          data: string
          destino: string
          equipe: string | null
          grupo_id: string | null
          id: string
          observacao: string
          situacao: string
          tipo: string
          troco: number | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          colaborador: string
          created_at?: string
          data?: string
          destino?: string
          equipe?: string | null
          grupo_id?: string | null
          id?: string
          observacao?: string
          situacao?: string
          tipo?: string
          troco?: number | null
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          colaborador?: string
          created_at?: string
          data?: string
          destino?: string
          equipe?: string | null
          grupo_id?: string | null
          id?: string
          observacao?: string
          situacao?: string
          tipo?: string
          troco?: number | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      epi_lancamentos: {
        Row: {
          created_at: string
          data: string
          equipamento_id: string
          hora: string
          id: string
          motivo: string
          observacao: string
          quantidade: number
          retirado_por: string
          tipo: string
          unidade: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          equipamento_id: string
          hora?: string
          id?: string
          motivo?: string
          observacao?: string
          quantidade?: number
          retirado_por?: string
          tipo: string
          unidade?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          equipamento_id?: string
          hora?: string
          id?: string
          motivo?: string
          observacao?: string
          quantidade?: number
          retirado_por?: string
          tipo?: string
          unidade?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_lancamentos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          created_at: string
          estoque_inicial: number
          id: string
          localizacao: string
          nome: string
          observacoes: string
          unidade: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estoque_inicial?: number
          id?: string
          localizacao?: string
          nome: string
          observacoes?: string
          unidade?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estoque_inicial?: number
          id?: string
          localizacao?: string
          nome?: string
          observacoes?: string
          unidade?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      equipes: {
        Row: {
          cor: string
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cor?: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          created_at: string
          data: string
          hora: string
          id: string
          observacao: string
          produto_id: string
          quantidade: number
          tipo: string
          unidade: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          hora?: string
          id?: string
          observacao?: string
          produto_id: string
          quantidade?: number
          tipo: string
          unidade?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          hora?: string
          id?: string
          observacao?: string
          produto_id?: string
          quantidade?: number
          tipo?: string
          unidade?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          dono_id: string | null
          email: string
          id: string
          nome: string
          papel: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dono_id?: string | null
          email?: string
          id?: string
          nome?: string
          papel?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dono_id?: string | null
          email?: string
          id?: string
          nome?: string
          papel?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          created_at: string
          estoque_inicial: number
          id: string
          localizacao: string
          nome: string
          observacoes: string
          unidade: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estoque_inicial?: number
          id?: string
          localizacao?: string
          nome: string
          observacoes?: string
          unidade?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estoque_inicial?: number
          id?: string
          localizacao?: string
          nome?: string
          observacoes?: string
          unidade?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tipos_diaria: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
          valor_padrao: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
          valor_padrao?: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
          valor_padrao?: number
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: string
          created_at: string
          id: string
          modelo: string
          observacoes: string
          placa: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ano?: string
          created_at?: string
          id?: string
          modelo?: string
          observacoes?: string
          placa?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: string
          created_at?: string
          id?: string
          modelo?: string
          observacoes?: string
          placa?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      pode_ver: { Args: { _dono: string }; Returns: boolean }
      registrar_perfil: {
        Args: never
        Returns: {
          created_at: string
          dono_id: string | null
          email: string
          id: string
          nome: string
          papel: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "perfis"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
