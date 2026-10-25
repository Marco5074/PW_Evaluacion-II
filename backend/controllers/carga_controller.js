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
    // aquí va la lógica
};