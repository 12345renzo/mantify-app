// Generado desde el proyecto de Supabase (generate_typescript_types). Regenerar al cambiar el esquema.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      avisos_membresia: {
        Row: {
          actualizado_en: string;
          creado_en: string;
          destinatario: string;
          detalle_error: string | null;
          empresa_id: string;
          enviado_en: string | null;
          id: string;
          membresia_id: string;
          resultado: string | null;
          tipo: string;
        };
        Insert: {
          actualizado_en?: string;
          creado_en?: string;
          destinatario: string;
          detalle_error?: string | null;
          empresa_id: string;
          enviado_en?: string | null;
          id?: string;
          membresia_id: string;
          resultado?: string | null;
          tipo: string;
        };
        Update: {
          actualizado_en?: string;
          creado_en?: string;
          destinatario?: string;
          detalle_error?: string | null;
          empresa_id?: string;
          enviado_en?: string | null;
          id?: string;
          membresia_id?: string;
          resultado?: string | null;
          tipo?: string;
        };
        Relationships: [];
      };
      empresas: {
        Row: {
          actualizado_en: string;
          correo_contacto: string | null;
          creado_en: string;
          dias_gracia: number;
          estado: string;
          id: string;
          inactivada_en: string | null;
          motivo_inactivacion: string | null;
          moneda: string;
          nombre: string;
          precio_mensual: number;
          plan_id: string;
          planificador_puede_validar: boolean;
          razon_social: string | null;
          ruc: string;
          slug: string;
          zona_horaria: string;
        };
        Insert: {
          actualizado_en?: string;
          correo_contacto?: string | null;
          creado_en?: string;
          dias_gracia?: number;
          estado?: string;
          id?: string;
          inactivada_en?: string | null;
          motivo_inactivacion?: string | null;
          moneda?: string;
          nombre: string;
          precio_mensual?: number;
          plan_id: string;
          planificador_puede_validar?: boolean;
          razon_social?: string | null;
          ruc: string;
          slug: string;
          zona_horaria?: string;
        };
        Update: {
          actualizado_en?: string;
          correo_contacto?: string | null;
          creado_en?: string;
          dias_gracia?: number;
          estado?: string;
          id?: string;
          inactivada_en?: string | null;
          motivo_inactivacion?: string | null;
          moneda?: string;
          nombre?: string;
          precio_mensual?: number;
          plan_id?: string;
          planificador_puede_validar?: boolean;
          razon_social?: string | null;
          ruc?: string;
          slug?: string;
          zona_horaria?: string;
        };
        Relationships: [
          {
            foreignKeyName: "empresas_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "planes";
            referencedColumns: ["id"];
          },
        ];
      };
      membresias: {
        Row: {
          actualizado_en: string;
          creado_en: string;
          empresa_id: string;
          estado: string;
          fecha_fin: string;
          fecha_inicio: string;
          id: string;
          moneda: string;
          monto: number;
          plan_id: string;
        };
        Insert: {
          actualizado_en?: string;
          creado_en?: string;
          empresa_id: string;
          estado?: string;
          fecha_fin: string;
          fecha_inicio: string;
          id?: string;
          moneda?: string;
          monto: number;
          plan_id: string;
        };
        Update: {
          actualizado_en?: string;
          creado_en?: string;
          empresa_id?: string;
          estado?: string;
          fecha_fin?: string;
          fecha_inicio?: string;
          id?: string;
          moneda?: string;
          monto?: number;
          plan_id?: string;
        };
        Relationships: [];
      };
      pagos: {
        Row: {
          actualizado_en: string;
          comprobante: string | null;
          creado_en: string;
          empresa_id: string;
          estado: string;
          id: string;
          id_pago_proveedor: string | null;
          membresia_id: string | null;
          moneda: string;
          monto: number;
          proveedor: string;
          referencia: string | null;
        };
        Insert: {
          actualizado_en?: string;
          comprobante?: string | null;
          creado_en?: string;
          empresa_id: string;
          estado?: string;
          id?: string;
          id_pago_proveedor?: string | null;
          membresia_id?: string | null;
          moneda?: string;
          monto: number;
          proveedor?: string;
          referencia?: string | null;
        };
        Update: {
          actualizado_en?: string;
          comprobante?: string | null;
          creado_en?: string;
          empresa_id?: string;
          estado?: string;
          id?: string;
          id_pago_proveedor?: string | null;
          membresia_id?: string | null;
          moneda?: string;
          monto?: number;
          proveedor?: string;
          referencia?: string | null;
        };
        Relationships: [];
      };
      personas: {
        Row: {
          actualizado_en: string;
          apellidos: string;
          cargo: string | null;
          creado_en: string;
          creado_por: string | null;
          dado_de_baja_en: string | null;
          empresa_id: string;
          estado: string;
          id: string;
          nombres: string;
          numero_documento: string | null;
          telefono: string | null;
          tipo_documento: string | null;
          tipo_vinculo: string | null;
        };
        Insert: {
          actualizado_en?: string;
          apellidos: string;
          cargo?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          dado_de_baja_en?: string | null;
          empresa_id: string;
          estado?: string;
          id?: string;
          nombres: string;
          numero_documento?: string | null;
          telefono?: string | null;
          tipo_documento?: string | null;
          tipo_vinculo?: string | null;
        };
        Update: {
          actualizado_en?: string;
          apellidos?: string;
          cargo?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          dado_de_baja_en?: string | null;
          empresa_id?: string;
          estado?: string;
          id?: string;
          nombres?: string;
          numero_documento?: string | null;
          telefono?: string | null;
          tipo_documento?: string | null;
          tipo_vinculo?: string | null;
        };
        Relationships: [];
      };
      planes: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          codigo: string;
          creado_en: string;
          id: string;
          max_accesos: number | null;
          moneda: string;
          nombre: string;
          precio_mensual: number;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          codigo: string;
          creado_en?: string;
          id?: string;
          max_accesos?: number | null;
          moneda?: string;
          nombre: string;
          precio_mensual: number;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          codigo?: string;
          creado_en?: string;
          id?: string;
          max_accesos?: number | null;
          moneda?: string;
          nombre?: string;
          precio_mensual?: number;
        };
        Relationships: [];
      };
      usuarios: {
        Row: {
          actualizado_en: string;
          correo: string;
          creado_en: string;
          creado_por: string | null;
          debe_cambiar_clave: boolean;
          empresa_id: string | null;
          id: string;
          persona_id: string | null;
          rol: string;
          ultimo_acceso_en: string | null;
        };
        Insert: {
          actualizado_en?: string;
          correo: string;
          creado_en?: string;
          creado_por?: string | null;
          debe_cambiar_clave?: boolean;
          empresa_id?: string | null;
          id: string;
          persona_id?: string | null;
          rol: string;
          ultimo_acceso_en?: string | null;
        };
        Update: {
          actualizado_en?: string;
          correo?: string;
          creado_en?: string;
          creado_por?: string | null;
          debe_cambiar_clave?: boolean;
          empresa_id?: string | null;
          id?: string;
          persona_id?: string | null;
          rol?: string;
          ultimo_acceso_en?: string | null;
        };
        Relationships: [];
      };
      areas_responsables: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          nombre: string;
          tipo: string;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          nombre: string;
          tipo: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          nombre?: string;
          tipo?: string;
        };
        Relationships: [];
      };
      motivos_retiro_neumatico: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          nombre: string;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          nombre: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      nombres_plan_preventivo: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          nombre: string;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          nombre: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      sistemas_mantenimiento: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          nombre: string;
          orden: number | null;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          nombre: string;
          orden?: number | null;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          nombre?: string;
          orden?: number | null;
        };
        Relationships: [];
      };
      tipos_grasa: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          nombre: string;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          nombre: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      ubicaciones: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          nombre: string;
          orden: number | null;
          tipo: string;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          nombre: string;
          orden?: number | null;
          tipo: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          nombre?: string;
          orden?: number | null;
          tipo?: string;
        };
        Relationships: [];
      };
      categorias_equipo: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          nombre: string;
          nombre_flota: string | null;
          orden: number | null;
          tipo_medidor: string;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          nombre: string;
          nombre_flota?: string | null;
          orden?: number | null;
          tipo_medidor: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          nombre?: string;
          nombre_flota?: string | null;
          orden?: number | null;
          tipo_medidor?: string;
        };
        Relationships: [];
      };
      motivos_parada: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          codigo: string;
          creado_en: string;
          creado_por: string | null;
          duracion_estandar_horas: number | null;
          empresa_id: string;
          es_planificado: boolean;
          id: string;
          nombre: string;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          codigo: string;
          creado_en?: string;
          creado_por?: string | null;
          duracion_estandar_horas?: number | null;
          empresa_id: string;
          id?: string;
          nombre: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          codigo?: string;
          creado_en?: string;
          creado_por?: string | null;
          duracion_estandar_horas?: number | null;
          empresa_id?: string;
          id?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      plantillas_actividades: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          categoria_id: string | null;
          creado_en: string;
          creado_por: string | null;
          descripcion: string;
          empresa_id: string;
          id: string;
          orden: number | null;
          plan: string | null;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          categoria_id?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          descripcion: string;
          empresa_id: string;
          id?: string;
          orden?: number | null;
          plan?: string | null;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          categoria_id?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          descripcion?: string;
          empresa_id?: string;
          id?: string;
          orden?: number | null;
          plan?: string | null;
        };
        Relationships: [];
      };
      plantillas_disposicion_neumatico: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          layout: string;
          nombre: string;
          preset: string;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          layout: string;
          nombre: string;
          preset: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          layout?: string;
          nombre?: string;
          preset?: string;
        };
        Relationships: [];
      };
      plantillas_puntos_engrase: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          categoria_id: string | null;
          creado_en: string;
          creado_por: string | null;
          descripcion: string;
          empresa_id: string;
          id: string;
          orden: number | null;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          categoria_id?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          descripcion: string;
          empresa_id: string;
          id?: string;
          orden?: number | null;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          categoria_id?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          descripcion?: string;
          empresa_id?: string;
          id?: string;
          orden?: number | null;
        };
        Relationships: [];
      };
      equipos: {
        Row: {
          actualizado_en: string;
          actualizado_por: string | null;
          categoria_id: string;
          codigo: string;
          creado_en: string;
          creado_por: string | null;
          eliminado_en: string | null;
          empresa_id: string;
          estado_movilizacion: string;
          estado_operativo: string;
          horometro_actual: number;
          horometro_actual_en: string | null;
          id: string;
          id_externo: string | null;
          marca: string | null;
          modelo: string | null;
          numero_serie: string | null;
          requiere_engrase: boolean;
          ubicacion_id: string | null;
          version: number;
        };
        Insert: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          categoria_id: string;
          codigo: string;
          creado_en?: string;
          creado_por?: string | null;
          eliminado_en?: string | null;
          empresa_id: string;
          estado_movilizacion?: string;
          estado_operativo?: string;
          horometro_actual?: number;
          horometro_actual_en?: string | null;
          id?: string;
          id_externo?: string | null;
          marca?: string | null;
          modelo?: string | null;
          numero_serie?: string | null;
          requiere_engrase?: boolean;
          ubicacion_id?: string | null;
          version?: number;
        };
        Update: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          categoria_id?: string;
          codigo?: string;
          creado_en?: string;
          creado_por?: string | null;
          eliminado_en?: string | null;
          empresa_id?: string;
          estado_movilizacion?: string;
          estado_operativo?: string;
          horometro_actual?: number;
          horometro_actual_en?: string | null;
          id?: string;
          id_externo?: string | null;
          marca?: string | null;
          modelo?: string | null;
          numero_serie?: string | null;
          requiere_engrase?: boolean;
          ubicacion_id?: string | null;
          version?: number;
        };
        Relationships: [];
      };
      lecturas_horometro: {
        Row: {
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          equipo_id: string;
          es_correccion: boolean;
          fecha: string;
          id: string;
          motivo_correccion: string | null;
          origen_id: string | null;
          origen_tipo: string;
          valor: number;
        };
        Insert: {
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          equipo_id: string;
          es_correccion?: boolean;
          fecha: string;
          id?: string;
          motivo_correccion?: string | null;
          origen_id?: string | null;
          origen_tipo: string;
          valor: number;
        };
        Update: {
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          equipo_id?: string;
          es_correccion?: boolean;
          fecha?: string;
          id?: string;
          motivo_correccion?: string | null;
          origen_id?: string | null;
          origen_tipo?: string;
          valor?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      v_empresas_estado: {
        Row: {
          creado_en: string | null;
          dias_gracia: number | null;
          empresa_id: string | null;
          estado: string | null;
          estado_empresa: string | null;
          fecha_fin: string | null;
          fecha_inicio: string | null;
          membresia_id: string | null;
          motivo_inactivacion: string | null;
          nombre: string | null;
          plan_id: string | null;
          ruc: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      asignar_persona: {
        Args: { p_correo: string; p_persona_id: string; p_usuario_id: string };
        Returns: undefined;
      };
      dar_baja_persona: { Args: { p_persona_id: string }; Returns: undefined };
      empresa_activa: { Args: { p_empresa_id: string }; Returns: boolean };
      es_superadmin: { Args: never; Returns: boolean };
      marcar_clave_cambiada: { Args: never; Returns: undefined };
      mi_acceso: {
        Args: never;
        Returns: {
          debe_cambiar_clave: boolean;
          empresa_id: string | null;
          habilitado: boolean;
          motivo: string | null;
          persona_id: string | null;
          rol: string;
        }[];
      };
      mi_empresa_id: { Args: never; Returns: string };
      mi_persona_id: { Args: never; Returns: string };
      mi_rol: { Args: never; Returns: string };
      importar_equipos: { Args: { p_filas: Json }; Returns: Json };
      autores_lecturas: {
        Args: { p_equipo: string };
        Returns: { lectura_id: string; nombre: string }[];
      };
      normalizar_nombre: { Args: { t: string }; Returns: string };
      registrar_ingreso: { Args: never; Returns: undefined };
      revocar_sesiones_usuario: {
        Args: { p_usuario_id: string };
        Returns: undefined;
      };
      reactivar_empresa: {
        Args: {
          p_empresa_id: string;
          p_fecha_fin: string;
          p_fecha_inicio: string;
          p_plan_id: string;
          p_referencia: string;
        };
        Returns: string;
      };
      registrar_pago_manual: {
        Args: {
          p_empresa_id: string;
          p_fecha_fin: string;
          p_fecha_inicio: string;
          p_referencia: string;
        };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
