//Colocar aqui los edpoints 

import { Router } from "express";
import {
  obtenerInventario,
  obtenerCarga,
  agregarACarga,
  actualizarUnidades,
  eliminarSuministro,
} from "../controllers/carga_controller.js";
import { validarSesion } from "../middleware/sesion.js";

const router = Router();

router.use(validarSesion);

// Devuelve los detalles de la carga activa de la nave y los créditos disponibles
router.get("/api/inventario", obtenerInventario); 
router.get("/api/carga", obtenerCarga);
router.post("/api/carga/agregar", agregarACarga);
router.put("/api/carga/actualizar-unidades/:id" , actualizarUnidades); 
router.delete("/api/carga/eliminar/:id", eliminarSuministro);


export default router;
