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
      centros_custo: {
        Row: {
          created_at: string
          descricao: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clientes_viagem: {
        Row: {
          created_at: string
          endereco: string
          id: string
          nome: string
          observacao: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endereco?: string
          id?: string
          nome: string
          observacao?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          endereco?: string
          id?: string
          nome?: string
          observacao?: string
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
          veiculo_id: string | null
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
          veiculo_id?: string | null
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
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diarias_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_config: {
        Row: {
          created_at: string
          endereco: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endereco?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          endereco?: string
          updated_at?: string
          user_id?: string
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
      gastos: {
        Row: {
          categoria: string
          centro_id: string | null
          created_at: string
          data: string
          descricao: string
          forma_pagamento: string
          fornecedor: string
          id: string
          nota_fiscal: string
          observacao: string
          updated_at: string
          user_id: string
          valor: number
          veiculo_id: string | null
        }
        Insert: {
          categoria?: string
          centro_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          forma_pagamento?: string
          fornecedor?: string
          id?: string
          nota_fiscal?: string
          observacao?: string
          updated_at?: string
          user_id: string
          valor?: number
          veiculo_id?: string | null
        }
        Update: {
          categoria?: string
          centro_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          forma_pagamento?: string
          fornecedor?: string
          id?: string
          nota_fiscal?: string
          observacao?: string
          updated_at?: string
          user_id?: string
          valor?: number
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_centro_id_fkey"
            columns: ["centro_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      km_auditoria: {
        Row: {
          alterado_por: string
          created_at: string
          id: string
          km_anterior: number | null
          km_novo: number
          motivo: string
          user_id: string
          veiculo_id: string
        }
        Insert: {
          alterado_por: string
          created_at?: string
          id?: string
          km_anterior?: number | null
          km_novo: number
          motivo: string
          user_id: string
          veiculo_id: string
        }
        Update: {
          alterado_por?: string
          created_at?: string
          id?: string
          km_anterior?: number | null
          km_novo?: number
          motivo?: string
          user_id?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "km_auditoria_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          created_at: string
          data: string
          fardos: number | null
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
          fardos?: number | null
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
          fardos?: number | null
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
      manutencoes: {
        Row: {
          created_at: string
          data: string
          descricao: string
          fornecedor: string
          horimetro: number | null
          id: string
          km: number | null
          medida: string
          observacao: string
          proxima_data: string | null
          proxima_horas: number | null
          proxima_km: number | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
          veiculo_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          descricao?: string
          fornecedor?: string
          horimetro?: number | null
          id?: string
          km?: number | null
          medida?: string
          observacao?: string
          proxima_data?: string | null
          proxima_horas?: number | null
          proxima_km?: number | null
          tipo?: string
          updated_at?: string
          user_id: string
          valor?: number
          veiculo_id: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          fornecedor?: string
          horimetro?: number | null
          id?: string
          km?: number | null
          medida?: string
          observacao?: string
          proxima_data?: string | null
          proxima_horas?: number | null
          proxima_km?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
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
      troco_descontos: {
        Row: {
          colaborador: string
          created_at: string
          data: string
          forma: string
          id: string
          observacao: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          colaborador: string
          created_at?: string
          data?: string
          forma?: string
          id?: string
          observacao?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          colaborador?: string
          created_at?: string
          data?: string
          forma?: string
          id?: string
          observacao?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      unidades_apontamentos: {
        Row: {
          created_at: string
          data: string
          id: string
          justificativa: string
          peso_kg: number | null
          produto_id: string
          quantidade: number
          responsavel: string
          saldo_calculado: number | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          justificativa?: string
          peso_kg?: number | null
          produto_id: string
          quantidade: number
          responsavel?: string
          saldo_calculado?: number | null
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          justificativa?: string
          peso_kg?: number | null
          produto_id?: string
          quantidade?: number
          responsavel?: string
          saldo_calculado?: number | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_apontamentos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ano: string
          created_at: string
          id: string
          km_atual: number | null
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
          km_atual?: number | null
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
          km_atual?: number | null
          modelo?: string
          observacoes?: string
          placa?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      viagens: {
        Row: {
          chegada_em: string | null
          cliente_id: string | null
          combustivel_estimado_litros: number | null
          consumo_km_litro: number | null
          created_at: string
          data: string
          destino: string
          distancia_km: number | null
          houve_parada: boolean
          id: string
          motorista: string
          observacao: string
          origem: string
          paradas_justificativa: string
          paradas_min: number
          paradas_qtd: number
          pedagio_estimado: number | null
          pedagio_real: number | null
          saida_em: string | null
          saiu_empresa: boolean
          tem_volta: boolean
          tempo_estimado_min: number | null
          tempo_real_min: number | null
          tempo_volta_min: number | null
          updated_at: string
          user_id: string
          veiculo_id: string | null
          volta_chegada_em: string | null
          volta_saida_em: string | null
        }
        Insert: {
          chegada_em?: string | null
          cliente_id?: string | null
          combustivel_estimado_litros?: number | null
          consumo_km_litro?: number | null
          created_at?: string
          data?: string
          destino: string
          distancia_km?: number | null
          houve_parada?: boolean
          id?: string
          motorista?: string
          observacao?: string
          origem: string
          paradas_justificativa?: string
          paradas_min?: number
          paradas_qtd?: number
          pedagio_estimado?: number | null
          pedagio_real?: number | null
          saida_em?: string | null
          saiu_empresa?: boolean
          tem_volta?: boolean
          tempo_estimado_min?: number | null
          tempo_real_min?: number | null
          tempo_volta_min?: number | null
          updated_at?: string
          user_id?: string
          veiculo_id?: string | null
          volta_chegada_em?: string | null
          volta_saida_em?: string | null
        }
        Update: {
          chegada_em?: string | null
          cliente_id?: string | null
          combustivel_estimado_litros?: number | null
          consumo_km_litro?: number | null
          created_at?: string
          data?: string
          destino?: string
          distancia_km?: number | null
          houve_parada?: boolean
          id?: string
          motorista?: string
          observacao?: string
          origem?: string
          paradas_justificativa?: string
          paradas_min?: number
          paradas_qtd?: number
          pedagio_estimado?: number | null
          pedagio_real?: number | null
          saida_em?: string | null
          saiu_empresa?: boolean
          tem_volta?: boolean
          tempo_estimado_min?: number | null
          tempo_real_min?: number | null
          tempo_volta_min?: number | null
          updated_at?: string
          user_id?: string
          veiculo_id?: string | null
          volta_chegada_em?: string | null
          volta_saida_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viagens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_viagem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viagens_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      corrigir_km_veiculo: {
        Args: { _km: number; _motivo: string; _veiculo: string }
        Returns: undefined
      }
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
