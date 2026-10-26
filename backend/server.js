import express from "express";
import cors from "cors";
import cargaRoutes from "./routes/carga.js";
import reactorRoutes from "./routes/reactor.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/", cargaRoutes);
app.use("/", reactorRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});