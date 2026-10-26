import { Router } from "express";
import { obtenerSesion, reiniciarSesion } from "../controllers/sesion_controller.js";
import { validarSesion } from "../middleware/sesion.js";

const router = Router();

router.get("/api/sesion", validarSesion, obtenerSesion);
router.post("/api/sesion/reiniciar", reiniciarSesion);

export default router;
