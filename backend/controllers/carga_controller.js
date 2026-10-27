import { inventario, carga } from "../data/inventario.js";

// El precio se consulta en el inventario para no duplicarlo en cada item.
const calcularTotal = () => carga.itemsCargados.reduce((total, item) => {
  const suministro = inventario.find((producto) => producto.id === item.id);
  return total + suministro.precio * item.cantidad;
}, 0);

const resumenCarga = () => ({
  creditos: carga.creditos,
  itemsCargados: carga.itemsCargados,
  total: calcularTotal(),
  confirmada: carga.confirmada,
});

// El servidor también protege la carga; desactivar botones por sí solo no basta.
const rechazarCargaConfirmada = (res) => {
  if (!carga.confirmada) return false;
  res.status(409).json({
    mensaje: "La carga ya fue confirmada. Inicia una nueva misión para modificarla.",
  });
  return true;
};

export const obtenerInventario = (req, res) => {
  res.json(inventario);
};

export const obtenerCarga = (req, res) => {
  res.json(resumenCarga());
};

export const agregarACarga = (req, res) => {
  if (rechazarCargaConfirmada(res)) return;
  const { equipoId, cantidad } = req.body ?? {};
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return res.status(400).json({ mensaje: "La cantidad debe ser un entero mayor a 0" });
  }

  const suministro = inventario.find((producto) => producto.id === equipoId);
  if (!suministro) {
    return res.status(404).json({ mensaje: "Suministro no encontrado" });
  }
  if (suministro.stock < cantidad) {
    return res.status(400).json({ mensaje: "Stock en base insuficiente" });
  }
  if (calcularTotal() + suministro.precio * cantidad > carga.creditos) {
    return res.status(400).json({ mensaje: "Créditos insuficientes para esta cantidad" });
  }

  const existente = carga.itemsCargados.find((item) => item.id === equipoId);
  if (existente) existente.cantidad += cantidad;
  else carga.itemsCargados.push({ id: equipoId, cantidad });

  // Las unidades quedan reservadas mientras se arma la carga.
  suministro.stock -= cantidad;
  res.json(resumenCarga());
};

export const actualizarUnidades = (req, res) => {
  if (rechazarCargaConfirmada(res)) return;
  const id = Number(req.params.id);
  const nuevaCantidad = req.body?.cantidad;
  if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 0) {
    return res.status(400).json({ mensaje: "La cantidad debe ser un entero mayor o igual a 0" });
  }

  const suministro = inventario.find((producto) => producto.id === id);
  if (!suministro) {
    return res.status(404).json({ mensaje: "Suministro no encontrado" });
  }
  const item = carga.itemsCargados.find((cargado) => cargado.id === id);
  if (!item) {
    return res.status(404).json({ mensaje: "El suministro no está en la carga" });
  }

  // Se mueve solamente la diferencia, no la cantidad completa otra vez.
  const diferencia = nuevaCantidad - item.cantidad;
  if (diferencia > 0) {
    if (suministro.stock < diferencia) {
      return res.status(400).json({ mensaje: "Stock en base insuficiente" });
    }
    if (calcularTotal() + diferencia * suministro.precio > carga.creditos) {
      return res.status(400).json({ mensaje: "Créditos insuficientes para esta cantidad" });
    }
  }

  suministro.stock -= diferencia;
  item.cantidad = nuevaCantidad;
  if (nuevaCantidad === 0) {
    carga.itemsCargados = carga.itemsCargados.filter((cargado) => cargado.id !== id);
  }
  res.json(resumenCarga());
};

export const eliminarSuministro = (req, res) => {
  if (rechazarCargaConfirmada(res)) return;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensaje: "ID de suministro no válido" });
  }

  const indice = carga.itemsCargados.findIndex((item) => item.id === id);
  if (indice === -1) {
    return res.status(404).json({ mensaje: "Suministro no encontrado en la carga" });
  }
  const suministro = inventario.find((producto) => producto.id === id);
  if (!suministro) {
    return res.status(404).json({ mensaje: "Suministro no encontrado en el inventario" });
  }

  const [itemEliminado] = carga.itemsCargados.splice(indice, 1);
  suministro.stock += itemEliminado.cantidad;
  res.json({ mensaje: "Suministro eliminado de la carga", ...resumenCarga() });
};

export const confirmarCarga = (req, res) => {
  if (carga.itemsCargados.length === 0) {
    return res.status(400).json({ mensaje: "Añade al menos un suministro antes de confirmar." });
  }

  // Las unidades ya estaban reservadas: confirmar no descuenta stock otra vez.
  // Repetir esta petición devuelve el mismo estado y no duplica la operación.
  carga.confirmada = true;
  res.json({ mensaje: "Equipamiento confirmado. La misión está lista.", ...resumenCarga() });
};
