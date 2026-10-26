import { restablecerEstadoInicial } from "../data/inventario.js";
import {
  obtenerTiempoRestante,
  reiniciarTemporizadorSesion,
} from "../middleware/sesion.js";

export const obtenerSesion = (req, res) => {
  res.json({ tiempoRestante: obtenerTiempoRestante() });
};

export const reiniciarSesion = (req, res) => {
  restablecerEstadoInicial();
  reiniciarTemporizadorSesion();

  res.json({
    mensaje: "Sesión reiniciada",
    tiempoRestante: obtenerTiempoRestante(),
  });
};
