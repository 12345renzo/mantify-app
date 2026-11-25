// Generado desde el proyecto de Supabase (generate_typescript_types). Regenerar al cambiar el esquema.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      archivos: {
        Row: {
          creado_en: string;
          empresa_id: string;
          id: string;
          ruta_storage: string;
          subido_por: string | null;
          tamano_bytes: number;
          tipo_mime: string;
        };
        Insert: {
          creado_en?: string;
          empresa_id: string;
          id?: string;
          ruta_storage: string;
          subido_por?: string | null;
          tamano_bytes: number;
          tipo_mime: string;
        };
        Update: {
          creado_en?: string;
          empresa_id?: string;
          id?: string;
          ruta_storage?: string;
          subido_por?: string | null;
          tamano_bytes?: number;
          tipo_mime?: string;
        };
        Relationships: [
          {
            foreignKeyName: "archivos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "archivos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "archivos_subido_por_empresa_id_fkey";
            columns: ["subido_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "areas_responsables_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "areas_responsables_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "areas_responsables_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "areas_responsables_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
      };
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
        Relationships: [
          {
            foreignKeyName: "avisos_membresia_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "avisos_membresia_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "avisos_membresia_membresia_id_fkey";
            columns: ["membresia_id"];
            isOneToOne: false;
            referencedRelation: "membresias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "avisos_membresia_membresia_id_fkey";
            columns: ["membresia_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["membresia_id"];
          },
        ];
      };
      backlog_archivos: {
        Row: {
          archivo_id: string;
          backlog_id: string;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          rol: string;
        };
        Insert: {
          archivo_id: string;
          backlog_id: string;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          rol: string;
        };
        Update: {
          archivo_id?: string;
          backlog_id?: string;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          rol?: string;
        };
        Relationships: [
          {
            foreignKeyName: "backlog_archivos_archivo_id_empresa_id_fkey";
            columns: ["archivo_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "archivos";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlog_archivos_backlog_id_empresa_id_fkey";
            columns: ["backlog_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "backlogs";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlog_archivos_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlog_archivos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "backlog_archivos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
      };
      backlog_firmas: {
        Row: {
          archivo_id: string;
          backlog_id: string;
          creado_en: string;
          empresa_id: string;
          hash_contenido: string;
          id: string;
          nombre_firmante: string;
          tipo: string;
          usuario_id: string;
          vigente: boolean;
        };
        Insert: {
          archivo_id: string;
          backlog_id: string;
          creado_en?: string;
          empresa_id: string;
          hash_contenido: string;
          id?: string;
          nombre_firmante: string;
          tipo: string;
          usuario_id: string;
          vigente?: boolean;
        };
        Update: {
          archivo_id?: string;
          backlog_id?: string;
          creado_en?: string;
          empresa_id?: string;
          hash_contenido?: string;
          id?: string;
          nombre_firmante?: string;
          tipo?: string;
          usuario_id?: string;
          vigente?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "backlog_firmas_archivo_id_empresa_id_fkey";
            columns: ["archivo_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "archivos";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlog_firmas_backlog_id_empresa_id_fkey";
            columns: ["backlog_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "backlogs";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlog_firmas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "backlog_firmas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "backlog_firmas_usuario_id_empresa_id_fkey";
            columns: ["usuario_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
      };
      backlog_historial_estados: {
        Row: {
          backlog_id: string;
          clave_idempotencia: string | null;
          creado_en: string;
          empresa_id: string;
          estado_anterior: string | null;
          estado_nuevo: string;
          evento: string;
          id: string;
          nota: string | null;
          usuario_id: string;
        };
        Insert: {
          backlog_id: string;
          clave_idempotencia?: string | null;
          creado_en?: string;
          empresa_id: string;
          estado_anterior?: string | null;
          estado_nuevo: string;
          evento: string;
          id?: string;
          nota?: string | null;
          usuario_id: string;
        };
        Update: {
          backlog_id?: string;
          clave_idempotencia?: string | null;
          creado_en?: string;
          empresa_id?: string;
          estado_anterior?: string | null;
          estado_nuevo?: string;
          evento?: string;
          id?: string;
          nota?: string | null;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "backlog_historial_estados_backlog_id_empresa_id_fkey";
            columns: ["backlog_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "backlogs";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlog_historial_estados_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "backlog_historial_estados_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "backlog_historial_estados_usuario_id_empresa_id_fkey";
            columns: ["usuario_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
      };
      backlogs: {
        Row: {
          actualizado_en: string;
          actualizado_por: string | null;
          cerrado_por: string | null;
          codigo: string;
          componente: string;
          costo_estimado: number;
          creado_en: string;
          creado_por: string | null;
          criticidad: string;
          descripcion: string;
          devuelto_en: string | null;
          devuelto_por: string | null;
          eliminado_en: string | null;
          empresa_id: string;
          equipo_id: string;
          estado: string;
          fecha_cierre: string | null;
          fecha_observacion: string;
          fecha_programada: string;
          horometro_cierre: number | null;
          id: string;
          nota_devolucion: string | null;
          notas_cierre: string | null;
          orden_trabajo_id: string | null;
          parada_id: string | null;
          preventivo_id: string | null;
          origen: string;
          sistema_id: string | null;
          tecnico_cierre_id: string | null;
          validado_en: string | null;
          validado_por: string | null;
          version: number;
        };
        Insert: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          cerrado_por?: string | null;
          codigo: string;
          componente: string;
          costo_estimado?: number;
          creado_en?: string;
          creado_por?: string | null;
          criticidad: string;
          descripcion: string;
          devuelto_en?: string | null;
          devuelto_por?: string | null;
          eliminado_en?: string | null;
          empresa_id: string;
          equipo_id: string;
          estado?: string;
          fecha_cierre?: string | null;
          fecha_observacion: string;
          fecha_programada: string;
          horometro_cierre?: number | null;
          id?: string;
          nota_devolucion?: string | null;
          notas_cierre?: string | null;
          orden_trabajo_id?: string | null;
          parada_id?: string | null;
          preventivo_id?: string | null;
          origen?: string;
          sistema_id?: string | null;
          tecnico_cierre_id?: string | null;
          validado_en?: string | null;
          validado_por?: string | null;
          version?: number;
        };
        Update: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          cerrado_por?: string | null;
          codigo?: string;
          componente?: string;
          costo_estimado?: number;
          creado_en?: string;
          creado_por?: string | null;
          criticidad?: string;
          descripcion?: string;
          devuelto_en?: string | null;
          devuelto_por?: string | null;
          eliminado_en?: string | null;
          empresa_id?: string;
          equipo_id?: string;
          estado?: string;
          fecha_cierre?: string | null;
          fecha_observacion?: string;
          fecha_programada?: string;
          horometro_cierre?: number | null;
          id?: string;
          nota_devolucion?: string | null;
          notas_cierre?: string | null;
          orden_trabajo_id?: string | null;
          parada_id?: string | null;
          preventivo_id?: string | null;
          origen?: string;
          sistema_id?: string | null;
          tecnico_cierre_id?: string | null;
          validado_en?: string | null;
          validado_por?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "backlogs_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlogs_cerrado_por_empresa_id_fkey";
            columns: ["cerrado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlogs_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlogs_devuelto_por_empresa_id_fkey";
            columns: ["devuelto_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlogs_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "backlogs_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "backlogs_equipo_id_empresa_id_fkey";
            columns: ["equipo_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "equipos";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlogs_ot_fk";
            columns: ["orden_trabajo_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "ordenes_trabajo";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlogs_sistema_id_empresa_id_fkey";
            columns: ["sistema_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "sistemas_mantenimiento";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlogs_tecnico_cierre_id_empresa_id_fkey";
            columns: ["tecnico_cierre_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "backlogs_validado_por_empresa_id_fkey";
            columns: ["validado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "categorias_equipo_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "categorias_equipo_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "categorias_equipo_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categorias_equipo_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
      };
      empresas: {
        Row: {
          actualizado_en: string;
          correo_contacto: string | null;
          creado_en: string;
          dias_gracia: number;
          engrase_aviso_tipo: string;
          engrase_aviso_valor: number;
          estado: string;
          id: string;
          inactivada_en: string | null;
          moneda: string;
          motivo_inactivacion: string | null;
          nombre: string;
          plan_id: string;
          planificador_puede_validar: boolean;
          precio_mensual: number;
          prefijo_requisicion: string;
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
          engrase_aviso_tipo?: string;
          engrase_aviso_valor?: number;
          estado?: string;
          id?: string;
          inactivada_en?: string | null;
          moneda?: string;
          motivo_inactivacion?: string | null;
          nombre: string;
          plan_id: string;
          planificador_puede_validar?: boolean;
          precio_mensual?: number;
          prefijo_requisicion?: string;
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
          engrase_aviso_tipo?: string;
          engrase_aviso_valor?: number;
          estado?: string;
          id?: string;
          inactivada_en?: string | null;
          moneda?: string;
          motivo_inactivacion?: string | null;
          nombre?: string;
          plan_id?: string;
          planificador_puede_validar?: boolean;
          precio_mensual?: number;
          prefijo_requisicion?: string;
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
        Relationships: [
          {
            foreignKeyName: "equipos_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "equipos_categoria_id_empresa_id_fkey";
            columns: ["categoria_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "categorias_equipo";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "equipos_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "equipos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "equipos_ubicacion_id_empresa_id_fkey";
            columns: ["ubicacion_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "ubicaciones";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
      };
      eventos_auditoria: {
        Row: {
          accion: string;
          creado_en: string;
          datos_anteriores: Json | null;
          datos_nuevos: Json | null;
          empresa_id: string | null;
          id: number;
          registro_id: string;
          tabla: string;
          usuario_id: string | null;
        };
        Insert: {
          accion: string;
          creado_en?: string;
          datos_anteriores?: Json | null;
          datos_nuevos?: Json | null;
          empresa_id?: string | null;
          id?: never;
          registro_id: string;
          tabla: string;
          usuario_id?: string | null;
        };
        Update: {
          accion?: string;
          creado_en?: string;
          datos_anteriores?: Json | null;
          datos_nuevos?: Json | null;
          empresa_id?: string | null;
          id?: never;
          registro_id?: string;
          tabla?: string;
          usuario_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "eventos_auditoria_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "eventos_auditoria_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
      };
      eventos_neumatico: {
        Row: {
          clave: string | null;
          creado_en: string;
          creado_por: string | null;
          detalle: string | null;
          empresa_id: string;
          equipo_id: string | null;
          horometro: number | null;
          id: string;
          neumatico_id: string;
          posicion: string | null;
          tipo: string;
        };
        Insert: {
          clave?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          detalle?: string | null;
          empresa_id: string;
          equipo_id?: string | null;
          horometro?: number | null;
          id?: string;
          neumatico_id: string;
          posicion?: string | null;
          tipo: string;
        };
        Update: {
          clave?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          detalle?: string | null;
          empresa_id?: string;
          equipo_id?: string | null;
          horometro?: number | null;
          id?: string;
          neumatico_id?: string;
          posicion?: string | null;
          tipo?: string;
        };
        Relationships: [];
      };
      instalaciones_neumatico: {
        Row: {
          cerrado_por: string | null;
          cocada_montaje: number;
          creado_en: string;
          creado_por: string | null;
          desmontado_en: string | null;
          destino: string | null;
          empresa_id: string;
          equipo_id: string;
          horometro_desmontaje: number | null;
          horometro_montaje: number;
          id: string;
          montado_en: string;
          motivo_id: string | null;
          neumatico_id: string;
          posicion_id: string;
        };
        Insert: {
          cerrado_por?: string | null;
          cocada_montaje: number;
          creado_en?: string;
          creado_por?: string | null;
          desmontado_en?: string | null;
          destino?: string | null;
          empresa_id: string;
          equipo_id: string;
          horometro_desmontaje?: number | null;
          horometro_montaje: number;
          id?: string;
          montado_en: string;
          motivo_id?: string | null;
          neumatico_id: string;
          posicion_id: string;
        };
        Update: {
          cerrado_por?: string | null;
          cocada_montaje?: number;
          creado_en?: string;
          creado_por?: string | null;
          desmontado_en?: string | null;
          destino?: string | null;
          empresa_id?: string;
          equipo_id?: string;
          horometro_desmontaje?: number | null;
          horometro_montaje?: number;
          id?: string;
          montado_en?: string;
          motivo_id?: string | null;
          neumatico_id?: string;
          posicion_id?: string;
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
        Relationships: [
          {
            foreignKeyName: "lecturas_horometro_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "lecturas_horometro_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lecturas_horometro_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "lecturas_horometro_equipo_id_empresa_id_fkey";
            columns: ["equipo_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "equipos";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
      };
      mediciones_neumatico: {
        Row: {
          centro: number;
          empresa_id: string;
          externo: number;
          id: string;
          interno: number;
          neumatico_id: string;
          posicion_id: string;
          presion: number | null;
          recapado: number;
          sesion_id: string;
        };
        Insert: {
          centro: number;
          empresa_id: string;
          externo: number;
          id?: string;
          interno: number;
          neumatico_id: string;
          posicion_id: string;
          presion?: number | null;
          recapado?: number;
          sesion_id: string;
        };
        Update: {
          centro?: number;
          empresa_id?: string;
          externo?: number;
          id?: string;
          interno?: number;
          neumatico_id?: string;
          posicion_id?: string;
          presion?: number | null;
          recapado?: number;
          sesion_id?: string;
        };
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "membresias_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membresias_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "membresias_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "planes";
            referencedColumns: ["id"];
          },
        ];
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
          es_planificado: boolean | null;
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
          es_planificado?: boolean | null;
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
          es_planificado?: boolean | null;
          id?: string;
          nombre?: string;
        };
        Relationships: [
          {
            foreignKeyName: "motivos_parada_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "motivos_parada_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "motivos_parada_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "motivos_parada_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "motivos_retiro_neumatico_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "motivos_retiro_neumatico_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "motivos_retiro_neumatico_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "motivos_retiro_neumatico_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
      };
      neumaticos: {
        Row: {
          actualizado_en: string;
          actualizado_por: string | null;
          cocada_nueva: number;
          codigo: string;
          costo: number | null;
          costo_recapados: number;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          estado: string;
          horas_acumuladas: number;
          id: string;
          marca: string;
          medida: string;
          modelo: string | null;
          recapados: number;
          version: number;
        };
        Insert: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          cocada_nueva: number;
          codigo: string;
          costo?: number | null;
          costo_recapados?: number;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          estado?: string;
          horas_acumuladas?: number;
          id?: string;
          marca: string;
          medida: string;
          modelo?: string | null;
          recapados?: number;
          version?: number;
        };
        Update: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          cocada_nueva?: number;
          codigo?: string;
          costo?: number | null;
          costo_recapados?: number;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          estado?: string;
          horas_acumuladas?: number;
          id?: string;
          marca?: string;
          medida?: string;
          modelo?: string | null;
          recapados?: number;
          version?: number;
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
        Relationships: [
          {
            foreignKeyName: "nombres_plan_preventivo_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "nombres_plan_preventivo_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "nombres_plan_preventivo_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "nombres_plan_preventivo_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
      };
      ordenes_trabajo: {
        Row: {
          actualizado_en: string;
          actualizado_por: string | null;
          backlog_id: string;
          codigo: string;
          creado_en: string;
          creado_por: string;
          eliminado_en: string | null;
          empresa_id: string;
          estado: string;
          id: string;
          responsable_id: string;
          version: number;
        };
        Insert: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          backlog_id: string;
          codigo: string;
          creado_en?: string;
          creado_por: string;
          eliminado_en?: string | null;
          empresa_id: string;
          estado?: string;
          id?: string;
          responsable_id: string;
          version?: number;
        };
        Update: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          backlog_id?: string;
          codigo?: string;
          creado_en?: string;
          creado_por?: string;
          eliminado_en?: string | null;
          empresa_id?: string;
          estado?: string;
          id?: string;
          responsable_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ordenes_trabajo_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "ordenes_trabajo_backlog_id_empresa_id_fkey";
            columns: ["backlog_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "backlogs";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "ordenes_trabajo_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "ordenes_trabajo_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ordenes_trabajo_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "ordenes_trabajo_responsable_id_empresa_id_fkey";
            columns: ["responsable_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "pagos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "pagos_membresia_id_fkey";
            columns: ["membresia_id"];
            isOneToOne: false;
            referencedRelation: "membresias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagos_membresia_id_fkey";
            columns: ["membresia_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["membresia_id"];
          },
        ];
      };
      parametros_neumatico: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          categoria_id: string | null;
          cocada_alerta: number;
          cocada_minima: number;
          creado_en: string;
          creado_por: string | null;
          dias_sin_medir: number;
          diferencia_maxima: number;
          empresa_id: string;
          equipo_id: string | null;
          id: string;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          categoria_id?: string | null;
          cocada_alerta: number;
          cocada_minima: number;
          creado_en?: string;
          creado_por?: string | null;
          dias_sin_medir: number;
          diferencia_maxima: number;
          empresa_id: string;
          equipo_id?: string | null;
          id?: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          categoria_id?: string | null;
          cocada_alerta?: number;
          cocada_minima?: number;
          creado_en?: string;
          creado_por?: string | null;
          dias_sin_medir?: number;
          diferencia_maxima?: number;
          empresa_id?: string;
          equipo_id?: string | null;
          id?: string;
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
          firma_archivo_id: string | null;
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
          firma_archivo_id?: string | null;
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
          firma_archivo_id?: string | null;
          id?: string;
          nombres?: string;
          numero_documento?: string | null;
          telefono?: string | null;
          tipo_documento?: string | null;
          tipo_vinculo?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "personas_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "personas_firma_fk";
            columns: ["firma_archivo_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "archivos";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
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
      planes_engrase: {
        Row: {
          actualizado_en: string;
          actualizado_por: string | null;
          cada_dias: number | null;
          cada_horas: number | null;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          equipo_id: string;
          id: string;
          tipo_grasa_id: string;
        };
        Insert: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          cada_dias?: number | null;
          cada_horas?: number | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          equipo_id: string;
          id?: string;
          tipo_grasa_id: string;
        };
        Update: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          cada_dias?: number | null;
          cada_horas?: number | null;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          equipo_id?: string;
          id?: string;
          tipo_grasa_id?: string;
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
        Relationships: [
          {
            foreignKeyName: "plantillas_actividades_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "plantillas_actividades_categoria_id_empresa_id_fkey";
            columns: ["categoria_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "categorias_equipo";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "plantillas_actividades_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "plantillas_actividades_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plantillas_actividades_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "plantillas_disposicion_neumatic_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "plantillas_disposicion_neumatico_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "plantillas_disposicion_neumatico_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plantillas_disposicion_neumatico_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "plantillas_puntos_engrase_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "plantillas_puntos_engrase_categoria_id_empresa_id_fkey";
            columns: ["categoria_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "categorias_equipo";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "plantillas_puntos_engrase_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "plantillas_puntos_engrase_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plantillas_puntos_engrase_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
      };
      posiciones_neumatico: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          codigo: string;
          creado_en: string;
          creado_por: string | null;
          eje: number;
          empresa_id: string;
          equipo_id: string;
          id: string;
          orden: number;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          codigo: string;
          creado_en?: string;
          creado_por?: string | null;
          eje: number;
          empresa_id: string;
          equipo_id: string;
          id?: string;
          orden?: number;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          codigo?: string;
          creado_en?: string;
          creado_por?: string | null;
          eje?: number;
          empresa_id?: string;
          equipo_id?: string;
          id?: string;
          orden?: number;
        };
        Relationships: [];
      };
      puntos_engrase: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          actualizado_por: string | null;
          creado_en: string;
          creado_por: string | null;
          descripcion: string;
          empresa_id: string;
          equipo_id: string;
          id: string;
          orden: number;
        };
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          descripcion: string;
          empresa_id: string;
          equipo_id: string;
          id?: string;
          orden?: number;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          actualizado_por?: string | null;
          creado_en?: string;
          creado_por?: string | null;
          descripcion?: string;
          empresa_id?: string;
          equipo_id?: string;
          id?: string;
          orden?: number;
        };
        Relationships: [];
      };
      registros_engrase: {
        Row: {
          clave: string;
          completo: boolean;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          equipo_id: string;
          fecha: string;
          horometro: number;
          id: string;
          observacion: string | null;
          tipo_grasa_id: string;
        };
        Insert: {
          clave: string;
          completo: boolean;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          equipo_id: string;
          fecha: string;
          horometro: number;
          id?: string;
          observacion?: string | null;
          tipo_grasa_id: string;
        };
        Update: {
          clave?: string;
          completo?: boolean;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          equipo_id?: string;
          fecha?: string;
          horometro?: number;
          id?: string;
          observacion?: string | null;
          tipo_grasa_id?: string;
        };
        Relationships: [];
      };
      registros_engrase_puntos: {
        Row: {
          descripcion: string;
          empresa_id: string;
          engrasado: boolean;
          id: string;
          orden: number;
          registro_id: string;
        };
        Insert: {
          descripcion: string;
          empresa_id: string;
          engrasado: boolean;
          id?: string;
          orden?: number;
          registro_id: string;
        };
        Update: {
          descripcion?: string;
          empresa_id?: string;
          engrasado?: boolean;
          id?: string;
          orden?: number;
          registro_id?: string;
        };
        Relationships: [];
      };
      reportes_mantenimiento: {
        Row: {
          cerrado_en: string | null;
          cerrado_por: string | null;
          codigo: string;
          creado_en: string;
          empresa_id: string;
          estado: string;
          fecha: string;
          horometro: number;
          id: string;
          notas: string | null;
          orden_trabajo_id: string;
          tecnico_id: string;
        };
        Insert: {
          cerrado_en?: string | null;
          cerrado_por?: string | null;
          codigo: string;
          creado_en?: string;
          empresa_id: string;
          estado?: string;
          fecha: string;
          horometro: number;
          id?: string;
          notas?: string | null;
          orden_trabajo_id: string;
          tecnico_id: string;
        };
        Update: {
          cerrado_en?: string | null;
          cerrado_por?: string | null;
          codigo?: string;
          creado_en?: string;
          empresa_id?: string;
          estado?: string;
          fecha?: string;
          horometro?: number;
          id?: string;
          notas?: string | null;
          orden_trabajo_id?: string;
          tecnico_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reportes_mantenimiento_cerrado_por_empresa_id_fkey";
            columns: ["cerrado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "reportes_mantenimiento_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reportes_mantenimiento_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "reportes_mantenimiento_orden_trabajo_id_empresa_id_fkey";
            columns: ["orden_trabajo_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "ordenes_trabajo";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "reportes_mantenimiento_tecnico_id_empresa_id_fkey";
            columns: ["tecnico_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
      };
      requisiciones: {
        Row: {
          actualizado_en: string;
          actualizado_por: string | null;
          cantidad: number;
          clave_idempotencia: string;
          codigo: string;
          creado_en: string;
          descripcion: string;
          empresa_id: string;
          estado: string;
          id: string;
          orden_trabajo_id: string;
          solicitado_por: string;
          unidad: string | null;
        };
        Insert: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          cantidad: number;
          clave_idempotencia: string;
          codigo: string;
          creado_en?: string;
          descripcion: string;
          empresa_id: string;
          estado?: string;
          id?: string;
          orden_trabajo_id: string;
          solicitado_por: string;
          unidad?: string | null;
        };
        Update: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          cantidad?: number;
          clave_idempotencia?: string;
          codigo?: string;
          creado_en?: string;
          descripcion?: string;
          empresa_id?: string;
          estado?: string;
          id?: string;
          orden_trabajo_id?: string;
          solicitado_por?: string;
          unidad?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "requisiciones_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "requisiciones_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requisiciones_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "requisiciones_orden_trabajo_id_empresa_id_fkey";
            columns: ["orden_trabajo_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "ordenes_trabajo";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "requisiciones_solicitado_por_empresa_id_fkey";
            columns: ["solicitado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
      };
      secuencias_empresa: {
        Row: {
          actualizado_en: string;
          anio: number;
          empresa_id: string;
          tipo: string;
          ultimo_numero: number;
        };
        Insert: {
          actualizado_en?: string;
          anio?: number;
          empresa_id: string;
          tipo: string;
          ultimo_numero?: number;
        };
        Update: {
          actualizado_en?: string;
          anio?: number;
          empresa_id?: string;
          tipo?: string;
          ultimo_numero?: number;
        };
        Relationships: [
          {
            foreignKeyName: "secuencias_empresa_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "secuencias_empresa_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
      };
      sesiones_medicion_neumatico: {
        Row: {
          clave: string;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          equipo_id: string;
          fecha: string;
          horometro: number;
          id: string;
        };
        Insert: {
          clave: string;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          equipo_id: string;
          fecha: string;
          horometro: number;
          id?: string;
        };
        Update: {
          clave?: string;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          equipo_id?: string;
          fecha?: string;
          horometro?: number;
          id?: string;
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
        Relationships: [
          {
            foreignKeyName: "sistemas_mantenimiento_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "sistemas_mantenimiento_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "sistemas_mantenimiento_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sistemas_mantenimiento_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "tipos_grasa_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "tipos_grasa_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "tipos_grasa_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tipos_grasa_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "ubicaciones_actualizado_por_empresa_id_fkey";
            columns: ["actualizado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "ubicaciones_creado_por_empresa_id_fkey";
            columns: ["creado_por", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id", "empresa_id"];
          },
          {
            foreignKeyName: "ubicaciones_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ubicaciones_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "usuarios_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usuarios_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usuarios_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "v_empresas_estado";
            referencedColumns: ["empresa_id"];
          },
          {
            foreignKeyName: "usuarios_persona_id_empresa_id_fkey";
            columns: ["persona_id", "empresa_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id", "empresa_id"];
          },
        ];
      };
      planes_preventivos: {
        Row: {
          actualizado_en: string;
          cada_dias: number | null;
          cada_horas: number | null;
          creado_en: string;
          empresa_id: string;
          equipo_id: string;
          id: string;
          nombre_plan_id: string;
        };
        Insert: {
          actualizado_en?: string;
          cada_dias?: number | null;
          cada_horas?: number | null;
          creado_en?: string;
          empresa_id: string;
          equipo_id: string;
          id?: string;
          nombre_plan_id: string;
        };
        Update: {
          actualizado_en?: string;
          cada_dias?: number | null;
          cada_horas?: number | null;
          creado_en?: string;
          empresa_id?: string;
          equipo_id?: string;
          id?: string;
          nombre_plan_id?: string;
        };
        Relationships: [];
      };
      preventivo_actividades: {
        Row: {
          backlog_id: string | null;
          descripcion: string;
          empresa_id: string;
          id: string;
          observacion: string | null;
          orden: number;
          preventivo_id: string;
          resultado: string | null;
        };
        Insert: {
          backlog_id?: string | null;
          descripcion: string;
          empresa_id: string;
          id?: string;
          observacion?: string | null;
          orden?: number;
          preventivo_id: string;
          resultado?: string | null;
        };
        Update: {
          backlog_id?: string | null;
          descripcion?: string;
          empresa_id?: string;
          id?: string;
          observacion?: string | null;
          orden?: number;
          preventivo_id?: string;
          resultado?: string | null;
        };
        Relationships: [];
      };
      preventivo_archivos: {
        Row: {
          archivo_id: string;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          preventivo_id: string;
        };
        Insert: {
          archivo_id: string;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          preventivo_id: string;
        };
        Update: {
          archivo_id?: string;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          preventivo_id?: string;
        };
        Relationships: [];
      };
      preventivo_firmas: {
        Row: {
          archivo_id: string;
          creado_en: string;
          empresa_id: string;
          hash_contenido: string;
          id: string;
          nombre_firmante: string;
          preventivo_id: string;
          tipo: string;
          usuario_id: string;
          vigente: boolean;
        };
        Insert: {
          archivo_id: string;
          creado_en?: string;
          empresa_id: string;
          hash_contenido: string;
          id?: string;
          nombre_firmante: string;
          preventivo_id: string;
          tipo: string;
          usuario_id: string;
          vigente?: boolean;
        };
        Update: {
          archivo_id?: string;
          creado_en?: string;
          empresa_id?: string;
          hash_contenido?: string;
          id?: string;
          nombre_firmante?: string;
          preventivo_id?: string;
          tipo?: string;
          usuario_id?: string;
          vigente?: boolean;
        };
        Relationships: [];
      };
      preventivo_historial_estados: {
        Row: {
          clave_idempotencia: string | null;
          creado_en: string;
          empresa_id: string;
          estado_anterior: string | null;
          estado_nuevo: string;
          evento: string;
          id: string;
          nota: string | null;
          preventivo_id: string;
          usuario_id: string | null;
        };
        Insert: {
          clave_idempotencia?: string | null;
          creado_en?: string;
          empresa_id: string;
          estado_anterior?: string | null;
          estado_nuevo: string;
          evento: string;
          id?: string;
          nota?: string | null;
          preventivo_id: string;
          usuario_id?: string | null;
        };
        Update: {
          clave_idempotencia?: string | null;
          creado_en?: string;
          empresa_id?: string;
          estado_anterior?: string | null;
          estado_nuevo?: string;
          evento?: string;
          id?: string;
          nota?: string | null;
          preventivo_id?: string;
          usuario_id?: string | null;
        };
        Relationships: [];
      };
      preventivo_personal: {
        Row: {
          anulado: boolean;
          creado_en: string;
          empresa_id: string;
          id: string;
          persona_id: string;
          preventivo_id: string;
        };
        Insert: {
          anulado?: boolean;
          creado_en?: string;
          empresa_id: string;
          id?: string;
          persona_id: string;
          preventivo_id: string;
        };
        Update: {
          anulado?: boolean;
          creado_en?: string;
          empresa_id?: string;
          id?: string;
          persona_id?: string;
          preventivo_id?: string;
        };
        Relationships: [];
      };
      preventivo_repuestos: {
        Row: {
          anulado: boolean;
          cantidad: number;
          creado_en: string;
          descripcion: string;
          empresa_id: string;
          id: string;
          preventivo_id: string;
          unidad: string | null;
        };
        Insert: {
          anulado?: boolean;
          cantidad: number;
          creado_en?: string;
          descripcion: string;
          empresa_id: string;
          id?: string;
          preventivo_id: string;
          unidad?: string | null;
        };
        Update: {
          anulado?: boolean;
          cantidad?: number;
          creado_en?: string;
          descripcion?: string;
          empresa_id?: string;
          id?: string;
          preventivo_id?: string;
          unidad?: string | null;
        };
        Relationships: [];
      };
      preventivos: {
        Row: {
          actualizado_en: string;
          actualizado_por: string | null;
          codigo: string;
          creado_en: string;
          creado_por: string | null;
          devuelto_en: string | null;
          devuelto_por: string | null;
          duracion_horas: number | null;
          ejecutado_en: string | null;
          ejecutado_por: string | null;
          eliminado_en: string | null;
          empresa_id: string;
          equipo_id: string;
          estado: string;
          fecha_ejecucion: string | null;
          fecha_programada: string;
          hora_fin: string | null;
          hora_inicio: string | null;
          horometro_ejecucion: number | null;
          horometro_programado: number | null;
          id: string;
          nota_devolucion: string | null;
          notas: string | null;
          plan_id: string;
          responsable_id: string | null;
          tercero: string | null;
          tipo: string;
          turno: string | null;
          validado_en: string | null;
          validado_por: string | null;
          version: number;
        };
        Insert: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          codigo: string;
          creado_en?: string;
          creado_por?: string | null;
          devuelto_en?: string | null;
          devuelto_por?: string | null;
          duracion_horas?: number | null;
          ejecutado_en?: string | null;
          ejecutado_por?: string | null;
          eliminado_en?: string | null;
          empresa_id: string;
          equipo_id: string;
          estado?: string;
          fecha_ejecucion?: string | null;
          fecha_programada: string;
          hora_fin?: string | null;
          hora_inicio?: string | null;
          horometro_ejecucion?: number | null;
          horometro_programado?: number | null;
          id?: string;
          nota_devolucion?: string | null;
          notas?: string | null;
          plan_id: string;
          responsable_id?: string | null;
          tercero?: string | null;
          tipo: string;
          turno?: string | null;
          validado_en?: string | null;
          validado_por?: string | null;
          version?: number;
        };
        Update: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          codigo?: string;
          creado_en?: string;
          creado_por?: string | null;
          devuelto_en?: string | null;
          devuelto_por?: string | null;
          duracion_horas?: number | null;
          ejecutado_en?: string | null;
          ejecutado_por?: string | null;
          eliminado_en?: string | null;
          empresa_id?: string;
          equipo_id?: string;
          estado?: string;
          fecha_ejecucion?: string | null;
          fecha_programada?: string;
          hora_fin?: string | null;
          hora_inicio?: string | null;
          horometro_ejecucion?: number | null;
          horometro_programado?: number | null;
          id?: string;
          nota_devolucion?: string | null;
          notas?: string | null;
          plan_id?: string;
          responsable_id?: string | null;
          tercero?: string | null;
          tipo?: string;
          turno?: string | null;
          validado_en?: string | null;
          validado_por?: string | null;
          version?: number;
        };
        Relationships: [];
      };
      parada_archivos: {
        Row: {
          archivo_id: string;
          creado_en: string;
          creado_por: string | null;
          empresa_id: string;
          id: string;
          parada_id: string;
        };
        Insert: {
          archivo_id: string;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id: string;
          id?: string;
          parada_id: string;
        };
        Update: {
          archivo_id?: string;
          creado_en?: string;
          creado_por?: string | null;
          empresa_id?: string;
          id?: string;
          parada_id?: string;
        };
        Relationships: [];
      };
      paradas: {
        Row: {
          actualizado_en: string;
          actualizado_por: string | null;
          area_demora_id: string | null;
          area_parada_id: string | null;
          cerrado_en: string | null;
          cerrado_por: string | null;
          clave: string | null;
          clave_cierre: string | null;
          codigo: string;
          creado_en: string;
          creado_por: string | null;
          cruce_confirmado: boolean;
          descripcion: string | null;
          duracion_horas: number | null;
          eliminado_en: string | null;
          empresa_id: string;
          equipo_id: string;
          es_planificado: boolean;
          estado: string;
          fin: string | null;
          hallazgo: string | null;
          horometro_fin: number | null;
          horometro_inicio: number;
          id: string;
          id_importacion: string | null;
          inicio: string;
          motivo_id: string;
          responsable_externo: string | null;
          responsable_id: string | null;
          version: number;
        };
        Insert: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          area_demora_id?: string | null;
          area_parada_id?: string | null;
          cerrado_en?: string | null;
          cerrado_por?: string | null;
          clave?: string | null;
          clave_cierre?: string | null;
          codigo: string;
          creado_en?: string;
          creado_por?: string | null;
          cruce_confirmado?: boolean;
          descripcion?: string | null;
          eliminado_en?: string | null;
          empresa_id: string;
          equipo_id: string;
          es_planificado: boolean;
          estado?: string;
          fin?: string | null;
          hallazgo?: string | null;
          horometro_fin?: number | null;
          horometro_inicio: number;
          id?: string;
          id_importacion?: string | null;
          inicio: string;
          motivo_id: string;
          responsable_externo?: string | null;
          responsable_id?: string | null;
          version?: number;
        };
        Update: {
          actualizado_en?: string;
          actualizado_por?: string | null;
          area_demora_id?: string | null;
          area_parada_id?: string | null;
          cerrado_en?: string | null;
          cerrado_por?: string | null;
          clave?: string | null;
          clave_cierre?: string | null;
          codigo?: string;
          creado_en?: string;
          creado_por?: string | null;
          cruce_confirmado?: boolean;
          descripcion?: string | null;
          eliminado_en?: string | null;
          empresa_id?: string;
          equipo_id?: string;
          es_planificado?: boolean;
          estado?: string;
          fin?: string | null;
          hallazgo?: string | null;
          horometro_fin?: number | null;
          horometro_inicio?: number;
          id?: string;
          id_importacion?: string | null;
          inicio?: string;
          motivo_id?: string;
          responsable_externo?: string | null;
          responsable_id?: string | null;
          version?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      v_empresas_estado: {
        Row: {
          cuentas: number | null;
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
    };
    Functions: {
      cerrar_parada: {
        Args: {
          p_clave: string;
          p_confirmar_cruce: boolean;
          p_datos: Json;
          p_fotos: string[];
          p_parada: string;
        };
        Returns: undefined;
      };
      guardar_plan_engrase: {
        Args: { p_datos: Json; p_equipo: string };
        Returns: undefined;
      };
      importar_paradas: { Args: { p_filas: Json }; Returns: Json };
      iniciar_parada: {
        Args: {
          p_clave: string;
          p_confirmar_cruce: boolean;
          p_datos: Json;
          p_fotos: string[];
        };
        Returns: string;
      };
      paradas_reporte: {
        Args: {
          p_abiertas?: boolean;
          p_desde: string | null;
          p_equipo?: string;
          p_hasta: string | null;
          p_id?: string;
        };
        Returns: {
          area_demora: string | null;
          area_parada: string | null;
          backlog_codigo: string | null;
          backlog_id: string | null;
          codigo: string;
          cruce_confirmado: boolean;
          descripcion: string | null;
          duracion_horas: number | null;
          equipo: string;
          equipo_id: string;
          es_planificado: boolean;
          estado: string;
          fin: string | null;
          hallazgo: string | null;
          horometro_fin: number | null;
          horometro_inicio: number;
          id: string;
          inicio: string;
          motivo: string;
          motivo_codigo: string;
          responsable: string | null;
          responsable_id: string | null;
          version: number;
        }[];
      };
      ejecutar_preventivo: {
        Args: {
          p_clave: string;
          p_datos: Json;
          p_fotos: string[];
          p_prev: string;
        };
        Returns: undefined;
      };
      engrase_equipos: {
        Args: { p_equipo?: string };
        Returns: {
          cada_dias: number | null;
          cada_horas: number | null;
          categoria_id: string;
          codigo: string;
          horometro: number;
          id: string;
          tipo_grasa_id: string | null;
          tipo_medidor: string;
          ultimo_fecha: string | null;
          ultimo_horometro: number | null;
          ultimo_registro_fecha: string | null;
          ultimo_registro_horometro: number | null;
        }[];
      };
      equipos_para_preventivos: {
        Args: never;
        Returns: {
          codigo: string;
          horometro: number;
          id: string;
          movilizado: boolean;
        }[];
      };
      importar_preventivos: { Args: { p_filas: Json }; Returns: Json };
      personas_activas: {
        Args: never;
        Returns: { id: string; nombre: string }[];
      };
      programar_preventivo: {
        Args: { p_clave: string; p_datos: Json };
        Returns: string;
      };
      reprogramar_preventivo: {
        Args: { p_clave: string; p_fecha: string; p_prev: string };
        Returns: undefined;
      };
      validar_preventivo: {
        Args: {
          p_aprobar: boolean;
          p_clave: string;
          p_nota: string;
          p_prev: string;
        };
        Returns: undefined;
      };
      _acceso_trabajo: { Args: never; Returns: Record<string, unknown> };
      _exigir_validador: {
        Args: { a: Record<string, unknown>; p_cerrado_por: string };
        Returns: undefined;
      };
      _firmar: {
        Args: {
          p_backlog: string;
          p_empresa: string;
          p_persona: string;
          p_tipo: string;
          p_uid: string;
        };
        Returns: undefined;
      };
      _historial: {
        Args: {
          p_antes: string;
          p_backlog: string;
          p_clave: string;
          p_despues: string;
          p_empresa: string;
          p_evento: string;
          p_nota: string;
          p_uid: string;
        };
        Returns: undefined;
      };
      _registrar_archivo: {
        Args: { p_empresa: string; p_ruta: string; p_uid: string };
        Returns: string;
      };
      _ya_aplicado: {
        Args: { p_clave: string; p_empresa: string };
        Returns: string;
      };
      abrir_orden_trabajo: {
        Args: { p_backlog: string; p_clave: string; p_responsable: string };
        Returns: undefined;
      };
      asignar_persona: {
        Args: { p_correo: string; p_persona_id: string; p_usuario_id: string };
        Returns: undefined;
      };
      autores_lecturas: {
        Args: { p_equipo: string };
        Returns: {
          lectura_id: string;
          nombre: string;
        }[];
      };
      cambiar_estado_requisicion: {
        Args: { p_estado: string; p_id: string };
        Returns: undefined;
      };
      cerrar_reporte: {
        Args: {
          p_backlog: string;
          p_clave: string;
          p_fecha: string;
          p_fotos: string[];
          p_horometro: number;
          p_notas: string;
        };
        Returns: undefined;
      };
      configurar_aviso_engrase: {
        Args: { p_tipo: string; p_valor: number };
        Returns: undefined;
      };
      crear_backlog: {
        Args: { p_clave: string; p_datos: Json; p_fotos: string[] };
        Returns: string;
      };
      crear_requisicion: {
        Args: {
          p_cantidad: number;
          p_clave: string;
          p_descripcion: string;
          p_ot: string;
          p_unidad: string;
        };
        Returns: undefined;
      };
      dar_baja_persona: { Args: { p_persona_id: string }; Returns: undefined };
      editar_backlog: {
        Args: {
          p_backlog: string;
          p_datos: Json;
          p_motivo: string;
          p_version: number;
        };
        Returns: undefined;
      };
      empresa_activa: { Args: { p_empresa_id: string }; Returns: boolean };
      equipos_para_trabajos: {
        Args: never;
        Returns: {
          codigo: string;
          id: string;
          movilizado: boolean;
        }[];
      };
      es_superadmin: { Args: never; Returns: boolean };
      guardar_mi_firma: { Args: { p_ruta: string }; Returns: undefined };
      importar_equipos: { Args: { p_filas: Json }; Returns: Json };
      marcar_clave_cambiada: { Args: never; Returns: undefined };
      mi_acceso: {
        Args: never;
        Returns: {
          debe_cambiar_clave: boolean;
          empresa_id: string;
          habilitado: boolean;
          motivo: string;
          persona_id: string;
          rol: string;
        }[];
      };
      mi_empresa_id: { Args: never; Returns: string };
      mi_firma: { Args: never; Returns: string };
      mi_persona_id: { Args: never; Returns: string };
      mi_rol: { Args: never; Returns: string };
      nombres_trabajos: {
        Args: never;
        Returns: {
          id: string;
          nombre: string;
        }[];
      };
      normalizar_nombre: { Args: { t: string }; Returns: string };
      reabrir_trabajo: {
        Args: { p_backlog: string; p_clave: string; p_nota: string };
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
      cupo_cuentas: { Args: { p_empresa_id: string }; Returns: number };
      dar_de_baja_empresa: {
        Args: { p_empresa_id: string; p_motivo: string };
        Returns: undefined;
      };
      neumaticos_listado: {
        Args: { p_id?: string };
        Returns: {
          categoria_id: string | null;
          centro: number | null;
          cocada_montaje: number | null;
          cocada_nueva: number;
          codigo: string;
          costo: number | null;
          costo_recapados: number | null;
          equipo_codigo: string | null;
          equipo_horometro: number | null;
          equipo_id: string | null;
          estado: string;
          externo: number | null;
          horas_acumuladas: number;
          horometro_montaje: number | null;
          id: string;
          interno: number | null;
          marca: string;
          medicion_fecha: string | null;
          medida: string;
          medidor: string | null;
          modelo: string | null;
          montado_en: string | null;
          posicion_codigo: string | null;
          posicion_id: string | null;
          presion: number | null;
          recapados: number;
        }[];
      };
      neumaticos_equipos: {
        Args: never;
        Returns: {
          categoria_id: string;
          codigo: string;
          horometro: number;
          id: string;
          medidor: string;
        }[];
      };
      guardar_neumatico: {
        Args: { p_clave: string; p_datos: Json; p_id: string | null };
        Returns: string;
      };
      definir_posiciones: {
        Args: { p_equipo: string; p_posiciones: Json };
        Returns: undefined;
      };
      guardar_umbrales: {
        Args: {
          p_categoria: string | null;
          p_datos: Json | null;
          p_equipo: string | null;
        };
        Returns: undefined;
      };
      montar_neumatico: {
        Args: {
          p_clave: string;
          p_datos: Json;
          p_neumatico: string;
          p_posicion: string;
        };
        Returns: undefined;
      };
      desmontar_neumatico: {
        Args: { p_clave: string; p_datos: Json; p_neumatico: string };
        Returns: undefined;
      };
      rotar_neumaticos: {
        Args: {
          p_clave: string;
          p_datos: Json;
          p_destino: string;
          p_origen: string;
        };
        Returns: undefined;
      };
      recapar_neumatico: {
        Args: { p_clave: string; p_datos: Json; p_neumatico: string };
        Returns: undefined;
      };
      medir_neumaticos: {
        Args: { p_clave: string; p_datos: Json; p_equipo: string };
        Returns: string;
      };
      registrar_ingreso: { Args: never; Returns: undefined };
      registrar_engrase: {
        Args: { p_clave: string; p_datos: Json; p_equipo: string };
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
      revocar_sesiones_usuario: {
        Args: { p_usuario_id: string };
        Returns: undefined;
      };
      siguiente_codigo: {
        Args: { p_empresa_id: string; p_tipo: string };
        Returns: string;
      };
      validar_trabajo: {
        Args: {
          p_aprobar: boolean;
          p_backlog: string;
          p_clave: string;
          p_nota: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
