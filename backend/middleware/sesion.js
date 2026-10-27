import { carga } from "../data/inventario.js";

//establecer duración de sesión: 5 minutos
export const DURACION_SESION_MS = 5 * 60 * 1000;

let inicioSesion = Date.now();

export const obtenerTiempoRestante = () =>
  Math.max(0, DURACION_SESION_MS - (Date.now() - inicioSesion));

//reiniciar el temporizador
export const reiniciarTemporizadorSesion = () => {
  inicioSesion = Date.now();
};

//mostrar mensaje de la sesión terminada
export const validarSesion = (req, res, next) => {
  if (!carga.confirmada && Date.now() - inicioSesion >= DURACION_SESION_MS) {
    return res.status(403).json({ mensaje: "La sesión expiró", expirada: true });
  }

  next();
};
