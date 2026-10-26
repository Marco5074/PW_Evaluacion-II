import { useEffect, useState } from 'react'
import { Container, Row, Col } from 'reactstrap'
import PanelMision from './components/PanelMision.jsx'
import BodegaCarga from './components/BodegaCarga.jsx'
import Catalogo from './components/Catalogo.jsx'
import AlertaError from './components/AlertaError.jsx'

// Datos temporales para trabajar sin depender del servidor.
const inventarioInicial = [
  { id: 201, nombre: 'Tanque de Oxígeno XL', precio: 50, stock: 5, categoria: 'Soporte Vital' },
  { id: 206, nombre: 'Traje Espacial', precio: 120, stock: 1, categoria: 'Equipo' },
  { id: 207, nombre: 'Panel Solar Portátil', precio: 80, stock: 3, categoria: 'Energía' },
]

const cargaInicial = [
  { id: 201, cantidad: 2 },
  { id: 206, cantidad: 1 },
  { id: 207, cantidad: 1 },
]

// Simula la consulta inicial de datos.
// Después se sustituirá por las consultas de api.js.
async function obtenerDatosDePrueba() {
  await new Promise((resolver) => setTimeout(resolver, 500))

  return {
    inventario: inventarioInicial,
    itemsCargados: cargaInicial,
  }
}
// onSesionExpirada la entrega Principal.jsx: se llama cuando el servidor
// responde { expirada: true } para mostrar la pantalla de sesión expirada.
function App({ onSesionExpirada }) {
  const presupuestoInicial = 500

  // Guardamos el inventario y la carga que recibe la pantalla.
  const [inventarioBase, setInventarioBase] = useState([])
  const [itemsCargados, setItemsCargados] = useState([])

  // Distinguimos la carga inicial de las acciones de los botones.
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)

  // Guarda el mensaje de una operación que haya fallado.
  const [error, setError] = useState(null)

  // Pedimos los datos cuando se abre esta pantalla.
  useEffect(() => {
    // Evita actualizar una pantalla que ya se haya cerrado.
    let activo = true

    async function cargarMision() {
      try {
        const datos = await obtenerDatosDePrueba()

        if (!activo) {
          return
        }

        setInventarioBase(datos.inventario)
        setItemsCargados(datos.itemsCargados)
        setError(null)
      } catch (fallo) {
        if (activo) {
          if (fallo.expirada) {
            onSesionExpirada?.()
          } else {
            setError(fallo.message || 'No se pudo cargar la misión.')
          }
        }
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    cargarMision()

    // React ejecuta esta limpieza al retirar la pantalla.
    return () => {
      activo = false
    }
  }, [onSesionExpirada])

  // En esta demostración descontamos del stock lo cargado en la nave.
  const inventario = inventarioBase.map((producto) => {
    const item = itemsCargados.find(
      (cargado) => cargado.id === producto.id
    )

    return {
      ...producto,
      stock: producto.stock - (item?.cantidad ?? 0),
    }
  })

  // Sumamos precio por cantidad para obtener el costo de la carga.
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

  // Controla la espera, los errores y el bloqueo de botones.
  async function ejecutarConEspera(accion) {
    if (procesando || cargando) {
      return
    }

    setProcesando(true)
    setError(null)

    try {
      // Espera simulada: después se reemplazará por la petición real.
      await new Promise((resolver) => setTimeout(resolver, 700))

      // También esperamos a que termine la acción.
      await accion()
    } catch (fallo) {
      if (fallo.expirada) {
        // Se acabó el tiempo: la pantalla principal pide empezar de nuevo.
        onSesionExpirada?.()
      } else {
        setError(fallo.message || 'No se pudo completar la operación.')
      }
    } finally {
      setProcesando(false)
    }
  }

  function actualizarCantidad(id, nuevaCantidad) {
    if (procesando || cargando) {
      return
    }

    const item = itemsCargados.find((cargado) => cargado.id === id)
    const suministro = inventario.find((producto) => producto.id === id)

    // Comprobamos que el producto y la cantidad sean válidos.
    if (
      !item ||
      !suministro ||
      !Number.isInteger(nuevaCantidad) ||
      nuevaCantidad < 1
    ) {
      setError('La cantidad o el suministro no son válidos.')
      return
    }

    const diferencia = nuevaCantidad - item.cantidad

    if (diferencia > suministro.stock) {
      setError('Stock en base insuficiente')
      return
    }

    if (total + diferencia * suministro.precio > presupuestoInicial) {
      setError('Créditos insuficientes para esta cantidad')
      return
    }

    // Cambiamos únicamente el suministro seleccionado.
    return ejecutarConEspera(() => {
      setItemsCargados((actuales) =>
        actuales.map((cargado) =>
          cargado.id === id
            ? { ...cargado, cantidad: nuevaCantidad }
            : cargado
        )
      )
    })
  }

  // Eliminamos todas las unidades del suministro seleccionado.
  function desembarcar(id) {
    return ejecutarConEspera(() => {
      setItemsCargados((actuales) =>
        actuales.filter((item) => item.id !== id)
      )
    })
  }

  // Durante la consulta inicial todavía no mostramos la bodega.
  if (cargando) {
    return (
      <Container className="py-4 text-start">
        <p role="status">Cargando misión…</p>
      </Container>
    )
  }

  return (
    <Container className="py-4 text-start">
      <PanelMision creditos={creditosDisponibles} total={total} />

      {procesando && (
        <p role="status" className="text-info">
          Calculando peso…
        </p>
      )}

      {/* Mensaje temporal para comprobar el estado de error.
          Michelle integrará aquí su componente de alerta definitivo. */}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}

      <Row>
        <Col md="8">
          <p>Aquí se integrará el catálogo de suministros.</p>
        </Col>

        <Col md="4">
          <BodegaCarga
            inventario={inventario}
            itemsCargados={itemsCargados}
            creditosDisponibles={creditosDisponibles}
            procesando={procesando}
            onActualizar={actualizarCantidad}
            onEliminar={desembarcar}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default App