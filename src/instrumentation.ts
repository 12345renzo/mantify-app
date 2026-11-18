import { getServerEnv } from "@/shared/env/env";

// Se ejecuta al arrancar el servidor: si falta una variable, el proceso no arranca.
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    getServerEnv();
  }
}
