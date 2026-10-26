import { inventario, carga } from "../data/inventario.js";

// Función auxiliar: calcula el costo total de la carga
const calcularTotal = () => {

    let total = 0;

    carga.itemsCargados.forEach(item => {

        const suministro = inventario.find((i) => i.id === item.id);  // s --> suministro 
        total += suministro.precio * item.cantidad;
    });

    return total;
};

// GET /api/inventario
export const obtenerInventario = (req, res) => {

    if (inventario.length === 0) {
        return res.status(404).json({ mensaje: "El inventario esta vacio" }); // Veremos si dejarlo 
    }

    res.json(inventario);
};

// GET /api/carga
export const obtenerCarga = (req, res) => {

    res.json({
        creditos: carga.creditos,
        itemsCargados: carga.itemsCargados,
        total: calcularTotal(),
    });
};

// POST /api/carga/agregar
export const agregarACarga = (req, res) => {
    const { equipoId, cantidad } = req.body;

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({ mensaje: "La cantidad debe ser un entero mayor a 0" });
    }

    const suministro = inventario.find((s) => s.id === equipoId);
    if (!suministro) {
        return res.status(404).json({ mensaje: "Suministro no encontrado" });
    }

    if (suministro.stock < cantidad) {
        return res.status(400).json({ mensaje: "Stock en base insuficiente" });
    }

    const costo = suministro.precio * cantidad;
    if (calcularTotal() + costo > carga.creditos) {
        return res.status(400).json({ mensaje: "Créditos insuficientes para esta cantidad" });
    }

    const existente = carga.itemsCargados.find((item) => item.id === equipoId);
    if (existente) {
        existente.cantidad += cantidad;
    } else {
        carga.itemsCargados.push({ id: equipoId, cantidad });
    }

    suministro.stock -= cantidad;

    res.json({
        creditos: carga.creditos,
        itemsCargados: carga.itemsCargados,
        total: calcularTotal(),
    });
};

// PUT /api/carga/actualizar-unidades/:id
export const actualizarUnidades = (req, res) => {
    const id = Number(req.params.id);
    const nuevaCantidad = req.body.cantidad;

    if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 0) {
        return res.status(400).json({ mensaje: "La cantidad debe ser un entero mayor o igual a 0" });
    }


    const suministro = inventario.find((s) => s.id === id);
    if (!suministro) {
        return res.status(404).json({ mensaje: "Suministro no encontrado" });
    }

    const item = carga.itemsCargados.find((i) => i.id === id);
    if (!item) {
        return res.status(404).json({ mensaje: "El suministro no está en la carga" });
    }

    // diferencia > 0: sube (toma del stock). diferencia < 0: baja (devuelve al stock)
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

    // Si queda en 0, se quita de la carga
    if (nuevaCantidad === 0) {
        carga.itemsCargados = carga.itemsCargados.filter((i) => i.id !== id);
    }

    res.json({
        creditos: carga.creditos,
        itemsCargados: carga.itemsCargados,
        total: calcularTotal(),
    });
};

// DELETE /api/carga/eliminar/:id
export const eliminarSuministro = (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ mensaje: "ID de suministro no válido" });
    }

    const indice = carga.itemsCargados.findIndex((item) => item.id === id);
    if (indice === -1) {
        return res.status(404).json({ mensaje: "Suministro no encontrado en la carga" });
    }

    const suministro = inventario.find((item) => item.id === id);
    if (!suministro) {
        return res.status(404).json({ mensaje: "Suministro no encontrado en el inventario" });
    }

    const [itemEliminado] = carga.itemsCargados.splice(indice, 1);
    suministro.stock += itemEliminado.cantidad;

    res.json({
        mensaje: "Suministro eliminado de la carga",
        creditos: carga.creditos,
        itemsCargados: carga.itemsCargados,
        total: calcularTotal(),
    });
};