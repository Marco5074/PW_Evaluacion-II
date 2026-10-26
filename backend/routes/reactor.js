import { Router } from "express";
import { validarTemperatura, reiniciarSistema } from "../controllers/reactor_controller.js";
import { validarSesion } from "../middleware/sesion.js";

const router = Router();

router.use(validarSesion);

router.post("/adjust", validarTemperatura);
router.post("/reboot", reiniciarSistema);

export default router;