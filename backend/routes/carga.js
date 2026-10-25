//Colocar aqui los edpoints 

import { Router } from "express";
import { obtenerInventario, obtenerCarga, agregarCarga , actualizarUnidades} from "../controllers/carga_controller.js";

const router = Router();

// Devuelve los detalles de la carga activa de la nave y los créditos disponibles
router.get("/api/inventario", obtenerInventario); 
router.get("/api/carga", obtenerCarga);
router.post("/api/carga/agregar", "id" , "cantidad" , agregarCarga);
router.put("/api/carga/actualizar-unidades/:id" , actualizarUnidades); 


export default router;
