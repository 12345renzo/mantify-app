import type { Result } from "@/shared/kernel/result";
import type { Cupo } from "../domain/reglas-persona-cuenta";
import type { RolEmpresa } from "../domain/permisos";

export type DatosPersona = {
  nombres: string;
  apellidos: string;
  tipoDocumento: "DNI" | "CE" | "PASAPORTE" | null;
  numeroDocumento: string | null;
  cargo: string | null;
  telefono: string | null;
  tipoVinculo: "PROPIO" | "CONTRATISTA" | null;
};

export type PersonaInfo = {
  id: string;
  empresaId: string;
  activa: boolean;
  // Cuenta asignada a la persona, si tiene.
  cuenta: { id: string; rol: string } | null;
};

export type CuentaInfo = {
  id: string;
  empresaId: string | null;
  rol: string;
  personaId: string | null;
  correo: string;
};

export interface PersonasRepositorio {
  crear(
    empresaId: string,
    datos: DatosPersona,
    creadoPor: string,
  ): Promise<Result<{ id: string }>>;
  obtener(id: string): Promise<Result<PersonaInfo>>;
  actualizar(id: string, datos: DatosPersona): Promise<Result<void>>;
  // Deja la persona en BAJA, vence las sesiones de su cuenta y la libera (una transacción en la base).
  darDeBaja(id: string): Promise<Result<void>>;
  // Vuelve a ACTIVA. No devuelve la cuenta: sigue libre hasta que se la asignen.
  reactivar(id: string): Promise<Result<void>>;
}

export interface CuentasRepositorio {
  cupo(empresaId: string): Promise<Cupo>;
  insertar(datos: {
    id: string;
    empresaId: string;
    personaId: string;
    rol: RolEmpresa;
    correo: string;
    creadoPor: string;
  }): Promise<Result<void>>;
  obtener(id: string): Promise<Result<CuentaInfo>>;
  // Asigna la persona y el correo nuevo, y vence las sesiones de quien la usaba antes.
  asignarPersona(
    id: string,
    personaId: string,
    correo: string,
  ): Promise<Result<void>>;
  cambiarRol(id: string, rol: RolEmpresa): Promise<Result<void>>;
  marcarClaveCambiada(): Promise<Result<void>>;
}

// Supabase Auth. La contraseña vive solo ahí, cifrada; nunca en nuestras tablas.
export interface ServicioAuth {
  crearCuenta(correo: string): Promise<Result<{ id: string; clave: string }>>;
  eliminarCuenta(id: string): Promise<void>;
  cambiarCorreoYClave(
    id: string,
    correo: string,
  ): Promise<Result<{ clave: string }>>;
  verificarClave(correo: string, clave: string): Promise<boolean>;
  cambiarMiClave(nueva: string): Promise<Result<void>>;
}
