// El RUC es único, así que nombre + RUC da un slug único sin consultar la base.
export function crearSlugEmpresa(nombre: string, ruc: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base ? `${base}-${ruc}` : ruc;
}
