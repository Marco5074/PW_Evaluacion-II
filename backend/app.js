import express from "express";
import cors from "cors";
import cargaRoutes from "./routes/carga.js";
import reactorRoutes from "./routes/reactor.js";
import sesionRoutes from "./routes/sesion.js";

const app = express();
app.use(cors());
app.use(express.json());

// El reinicio debe poder ejecutarse incluso después de expirar la sesión.
app.use("/", sesionRoutes);
app.use("/", cargaRoutes);
app.use("/", reactorRoutes);

app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// También los errores de JSON o errores inesperados mantienen el contrato.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const estado = error.status >= 400 && error.status < 500 ? error.status : 500;
  const mensaje = estado === 400
    ? "El cuerpo de la petición debe contener JSON válido."
    : "No se pudo completar la operación en el servidor.";
  res.status(estado).json({ mensaje });
});

export default app;
