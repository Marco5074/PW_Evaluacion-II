import { useEffect, useState } from 'react'
import { Button, Container, Row, Col } from 'reactstrap'
import PanelMision from './components/PanelMision.jsx'
import BodegaCarga from './components/BodegaCarga.jsx'
import {
  obtenerInventario,
  obtenerCarga,
  eliminarSuministro,
} from './services/api.js'

// Consultamos juntos el inventario y la carga reales.
async function consultarMision() {
  const [inventario, carga] = await Promise.all([
    obtenerInventario(),
    obtenerCarga(),
  ])

  return { inventario, carga }
}

function App() {
  // Los datos comienzan vacíos hasta recibir la respuesta del servidor.
  const [inventario, setInventario] = useState([])
  const [carga, setCarga] = useState(null)

  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)

  // Permite repetir la consulta si una petición falla.
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true

    async function cargarMision() {
      try {
        const datos = await consultarMision()

        if (!activo) {
          return
        }

        // El servidor ya devuelve el stock disponible.
        // No volvemos a descontar las unidades en el frontend.
        setInventario(datos.inventario)
        setCarga(datos.carga)
        setError(null)
      } catch (fallo) {
        if (activo) {
          // Conservamos también información como fallo.expirada.
          setError(fallo)
        }
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    cargarMision()

    return () => {
      activo = false
    }
  }, [intento])

  // Vuelve a consultar los datos sin reiniciar la sesión del servidor.
  function reintentar() {
    setCargando(true)
    setError(null)
    setIntento((actual) => actual + 1)
  }

  async function desembarcar(id) {
    if (procesando || cargando) {
      return
    }

    setProcesando(true)
    setError(null)

    try {
      // Pedimos al servidor que elimine el suministro.
      await eliminarSuministro(id)

      // Después consultamos nuevamente ambos datos.
      // Así el stock, la bodega y el total quedan sincronizados.
      const datos = await consultarMision()

      setInventario(datos.inventario)
      setCarga(datos.carga)
    } catch (fallo) {
      setError(fallo)
    } finally {
      setProcesando(false)
    }
  }

  if (cargando) {
    return (
      <Container className="py-4 text-start">
        <p role="status">Cargando misión…</p>
      </Container>
    )
  }

  // Si la primera consulta falla, mostramos el error.
  // No presentamos valores de ejemplo como si fueran reales.
  if (!carga) {
    return (
      <Container className="py-4 text-start">
        <p role="alert" className="text-danger">
          {error?.message || 'No se pudo cargar la misión.'}
        </p>

        <Button color="primary" onClick={reintentar}>
          Volver a consultar
        </Button>
      </Container>
    )
  }

  // En el backend actual, "creditos" es el presupuesto inicial.
  // Restamos el total una sola vez para mostrar el saldo disponible.
  const creditosDisponibles = carga.creditos - carga.total

  return (
    <Container className="py-4 text-start">
      <PanelMision
        creditos={creditosDisponibles}
        total={carga.total}
      />

      {procesando && (
        <p role="status" className="text-info">
          Calculando peso…
        </p>
      )}

      {/* Mensaje provisional; Michelle integrará su alerta definitiva. */}
      {error && (
        <div className="mb-3">
          <p role="alert" className="text-danger">
            {error.message}
          </p>

          <Button
            color="primary"
            size="sm"
            disabled={procesando}
            onClick={reintentar}
          >
            Volver a consultar
          </Button>
        </div>
      )}

      <Row>
        <Col md="8">
          <p>Aquí se integrará el catálogo de suministros.</p>
          <p>Suministros en la base: {inventario.length}</p>
        </Col>

        <Col md="4">
          {/* Solo conectamos la acción que ya está implementada. */}
          <BodegaCarga
            inventario={inventario}
            itemsCargados={carga.itemsCargados}
            creditosDisponibles={creditosDisponibles}
            procesando={procesando}
            onEliminar={desembarcar}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default App