import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Ban,
  Building2,
  CalendarDays,
  ChartColumn,
  ChartSpline,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  CreditCard,
  Disc3,
  Droplets,
  Eye,
  EyeOff,
  Gauge,
  Layers,
  LayoutDashboard,
  LibraryBig,
  Lock,
  LogOut,
  Menu,
  Moon,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Timer,
  TrendingUp,
  TriangleAlert,
  Truck,
  Users,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

/*
 * Los iconos vienen de Lucide. Este envoltorio conserva los nombres que ya usa
 * la app y fija el trazo y el tamaño por defecto para que todo el producto se
 * vea con el mismo peso visual.
 */
function crear(Icono: LucideIcon) {
  return function IconoMantify({
    strokeWidth = 1.75,
    width = 20,
    height = 20,
    ...props
  }: Props) {
    return (
      <Icono
        aria-hidden="true"
        width={width}
        height={height}
        strokeWidth={strokeWidth}
        {...props}
      />
    );
  };
}

export const IconoPanel = crear(LayoutDashboard);
export const IconoEmpresa = crear(Building2);
export const IconoPlanes = crear(Layers);
export const IconoPago = crear(CreditCard);
export const IconoPersonas = crear(Users);
export const IconoCatalogo = crear(LibraryBig);
export const IconoEquipo = crear(Truck);
export const IconoLlave = crear(Wrench);
export const IconoCalendario = crear(CalendarDays);
export const IconoParada = crear(TriangleAlert);
export const IconoGota = crear(Droplets);
export const IconoNeumatico = crear(Disc3);
export const IconoReporte = crear(ChartColumn);
export const IconoSol = crear(Sun);
export const IconoLuna = crear(Moon);
export const IconoSalir = crear(LogOut);
export const IconoMas = crear(Plus);
export const IconoFlecha = crear(ArrowRight);
export const IconoAtras = crear(ArrowLeft);
export const IconoEscudo = crear(ShieldCheck);
export const IconoCheck = crear(Check);
export const IconoMenu = crear(Menu);
export const IconoCerrar = crear(X);
export const IconoOjo = crear(Eye);
export const IconoOjoTachado = crear(EyeOff);
export const IconoReloj = crear(Clock);
export const IconoCandado = crear(Lock);

// Iconos de apoyo para las piezas nuevas (métricas, avisos y acentos).
export const IconoActividad = crear(Activity);
export const IconoAlerta = crear(CircleAlert);
export const IconoCheckCirculo = crear(CircleCheck);
export const IconoEscudoAlerta = crear(ShieldAlert);
export const IconoBloqueado = crear(Ban);
export const IconoTendencia = crear(TrendingUp);
export const IconoGrafico = crear(ChartSpline);
export const IconoMedidor = crear(Gauge);
export const IconoTiempo = crear(Timer);
export const IconoRayo = crear(Zap);
export const IconoChispa = crear(Sparkles);
export const IconoSalirArriba = crear(ArrowUpRight);
