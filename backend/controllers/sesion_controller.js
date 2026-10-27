//reiniciar inventario inicial
import { carga, restablecerEstadoInicial } from "../data/inventario.js";
import {
  obtenerTiempoRestante,
  reiniciarTemporizadorSesion,
} from "../middleware/sesion.js";

//muestra el tiempo restante de la sesion
export const obtenerSesion = (req, res) => {
  res.json({ tiempoRestante: obtenerTiempoRestante(), confirmada: carga.confirmada });
};

// reiniciar la sesión 
export const reiniciarSesion = (req, res) => {
  restablecerEstadoInicial();
  reiniciarTemporizadorSesion();

  res.json({
    mensaje: "Sesión reiniciada",
    tiempoRestante: obtenerTiempoRestante(),
  });
};
