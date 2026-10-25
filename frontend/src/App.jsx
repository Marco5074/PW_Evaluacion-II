import { useState } from 'react'
import { Container, Row, Col } from 'reactstrap'
import PanelMision from './components/PanelMision.jsx'
import BodegaCarga from './components/BodegaCarga.jsx'

// Inventario de prueba antes de cargar la nave.
// Hay cinco tanques en total.
// Inventario de prueba antes de cargar suministros en la nave.
const inventarioInicial = [
  { id: 201, nombre: 'Tanque de Oxígeno XL', precio: 50, stock: 5 },
  { id: 206, nombre: 'Traje Espacial', precio: 120, stock: 1 },
  { id: 207, nombre: 'Panel Solar Portátil', precio: 80, stock: 3 },
]

function App() {
  const presupuestoInicial = 500

  // useState permite cambiar la carga desde los botones.
  // Comenzamos con dos tanques dentro de la nave.

  // Carga inicial de prueba: dos tanques, un traje y un panel solar.
  const [itemsCargados, setItemsCargados] = useState([
    { id: 201, cantidad: 2 },
    { id: 206, cantidad: 1 },
    { id: 207, cantidad: 1 },
  ])

  // Para esta prueba calculamos las unidades que quedan en la base.
  // Si hay cinco tanques y cargamos dos, quedan tres disponibles.
  const inventario = inventarioInicial.map((producto) => {
    const item = itemsCargados.find(
      (cargado) => cargado.id === producto.id
    )

    return {
      ...producto,
      stock: producto.stock - (item?.cantidad ?? 0),
    }
  })

  // Calculamos el costo de todos los suministros cargados.
  const total = itemsCargados.reduce((acumulado, item) => {
    const suministro = inventario.find(
      (producto) => producto.id === item.id
    )

    if (!suministro) {
      return acumulado
    }

    return acumulado + suministro.precio * item.cantidad
  }, 0)

  const creditosDisponibles = presupuestoInicial - total

  // Recibe el suministro y la nueva cantidad total que queremos cargar.
  function actualizarCantidad(id, nuevaCantidad) {
    const item = itemsCargados.find((cargado) => cargado.id === id)
    const suministro = inventario.find((producto) => producto.id === id)

    // Evitamos cantidades inválidas y productos inexistentes.
    if (
      !item ||
      !suministro ||
      !Number.isInteger(nuevaCantidad) ||
      nuevaCantidad < 1
    ) {
      return
    }

    // Pasar de dos a tres unidades requiere un tanque adicional.
    const diferencia = nuevaCantidad - item.cantidad

    // Comprobamos que alcance el stock y el presupuesto.
    if (
      diferencia > suministro.stock ||
      total + diferencia * suministro.precio > presupuestoInicial
    ) {
      return
    }

    // Creamos una lista nueva cambiando solo el suministro seleccionado.
    setItemsCargados((actuales) =>
      actuales.map((cargado) =>
        cargado.id === id
          ? { ...cargado, cantidad: nuevaCantidad }
          : cargado
      )
    )
  }

  // Quitamos de la carga el suministro seleccionado.
  function desembarcar(id) {
    setItemsCargados((actuales) =>
      actuales.filter((item) => item.id !== id)
    )
  }

  return (
    <Container className="py-4 text-start">
      <PanelMision creditos={creditosDisponibles} total={total} />

      <Row>
        <Col md="8">
          <p>Aquí se integrará el catálogo de suministros.</p>
        </Col>

        <Col md="4">
          {/* Entregamos los datos y las acciones a la bodega. */}
          <BodegaCarga
            inventario={inventario}
            itemsCargados={itemsCargados}
            creditosDisponibles={creditosDisponibles}
            onActualizar={actualizarCantidad}
            onEliminar={desembarcar}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default App