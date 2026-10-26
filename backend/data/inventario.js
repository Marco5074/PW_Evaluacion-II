 // Agregar los suministros al inventario

export const inventario = [
  { id: 201, nombre: "Tanque de Oxígeno XL", precio: 50, stock: 5, categoria: "Soporte Vital" },
  { id: 202, nombre: "Filtro de Aire Orbital", precio: 30, stock: 2, categoria: "Soporte Vital" },
  { id: 203, nombre: "Paquete de Raciones", precio: 20, stock: 10, categoria: "Alimentos" },
  { id: 204, nombre: "Agua Purificada 20L", precio: 15, stock: 8, categoria: "Alimentos" },
  { id: 205, nombre: "Kit de Reparación", precio: 35, stock: 4, categoria: "Equipo" },
  { id: 206, nombre: "Traje Espacial", precio: 120, stock: 1, categoria: "Equipo" },
  { id: 207, nombre: "Panel Solar Portátil", precio: 80, stock: 3, categoria: "Energía" },
];


export const CREDITOS_INICIALES = 500;

const stockInicial = new Map(inventario.map(({ id, stock }) => [id, stock]));

export const carga = {
  creditos: CREDITOS_INICIALES,
  itemsCargados: [],
};

export const restablecerEstadoInicial = () => {
  inventario.forEach((suministro) => {
    suministro.stock = stockInicial.get(suministro.id);
  });

  carga.creditos = CREDITOS_INICIALES;
  carga.itemsCargados.length = 0;
};