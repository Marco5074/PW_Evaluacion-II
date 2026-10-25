import { Router } from "express";
import { validarTemperatura, reiniciarSistema } from "../controllers/reactor_controller.js";

const router = Router();

router.post("/adjust", validarTemperatura);
router.post("/reboot", reiniciarSistema);

export default router;