import express from "express";
import cors from "cors";
import cargaRoutes from "./routes/carga.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/", cargaRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});