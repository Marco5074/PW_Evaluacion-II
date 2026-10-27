import { useEffect, useState } from 'react'
import { Button, Container, Row, Col } from 'reactstrap'
import PanelMision from './components/PanelMision.jsx'
import BodegaCarga from './components/BodegaCarga.jsx'
import Catalogo from './components/Catalogo.jsx'
import AlertaError from './components/AlertaError.jsx'
import {
  obtenerInventario,
  obtenerSesion,
  obtenerCarga,
  agregarACarga,
  actualizarUnidades,
  eliminarSuministro,
} from './services/api.js'

// Consultamos ambos datos reales para mantenerlos sincronizados.
async function consultarMision() {
  const [inventario, carga] = await Promise.all([
    obtenerInventario(),
    obtenerCarga(),
  ])

  return { inventario, carga }
}

// Principal entrega la función que muestra la pantalla de sesión expirada.
function App({ onSesionExpirada }) {
  const [inventario, setInventario] = useState([])
  const [carga, setCarga] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    let temporizador

    async function cargarMision() {
      try {
        // Pedimos el tiempo que queda; no comenzamos cinco minutos nuevos.
        const sesion = await obtenerSesion()

        if (!activo) return

        // Si ya se acabó el tiempo, mostramos el aviso inmediatamente.
        if (sesion.tiempoRestante <= 0) {
          onSesionExpirada?.()
          return
        }

        // Mostramos el aviso al vencer el tiempo, sin esperar otro clic.
        temporizador = setTimeout(() => {
          if (activo) {
            onSesionExpirada?.()
          }
        }, sesion.tiempoRestante)

        // Cargamos el inventario y la bodega como antes.
        const datos = await consultarMision()

        if (!activo) return

        setInventario(datos.inventario)
        setCarga(datos.carga)
        setError(null)
      } catch (fallo) {
        if (activo) {
          setError(fallo)

          if (fallo.expirada) {
            onSesionExpirada?.()
          }
        }
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    cargarMision()

    return () => {
      // Cancelamos el aviso anterior al salir o volver a consultar.
      activo = false
      clearTimeout(temporizador)
    }
  }, [intento, onSesionExpirada])

  function reintentar() {
    setCargando(true)
    setError(null)
    setIntento((actual) => actual + 1)
  }

  // Añadir y desembarcar comparten la espera y la actualización de datos.
  async function ejecutarAccion(accion) {
    if (procesando || cargando) return

    setProcesando(true)
    setError(null)

    try {
      await accion()
      const datos = await consultarMision()

      setInventario(datos.inventario)
      setCarga(datos.carga)
    } catch (fallo) {
      setError(fallo)

      if (fallo.expirada) {
        onSesionExpirada?.()
      }
    } finally {
      setProcesando(false)
    }
  }

  // El catálogo de Michelle utiliza esta función para añadir una unidad.
  function agregarSuministro(id) {
    return ejecutarAccion(() => agregarACarga(id, 1))
  }

  // Envía la nueva cantidad total al servidor.
  // ejecutarAccion muestra la espera y después actualiza
  // el inventario, la carga, los créditos y el total.
  function actualizarCantidad(id, nuevaCantidad) {
    return ejecutarAccion(() => actualizarUnidades(id, nuevaCantidad))
  }

  function desembarcar(id) {
    return ejecutarAccion(() => eliminarSuministro(id))
  }

  if (cargando) {
    return (
      <Container className="py-4 text-start">
        <p role="status">Cargando misión…</p>
      </Container>
    )
  }

  if (!carga) {
    return (
      <Container className="py-4 text-start">
        <AlertaError
          mensaje={error?.message || 'No se pudo cargar la misión.'}
          onCerrar={() => setError(null)}
        />

        <Button color="primary" onClick={reintentar}>
          Volver a consultar
        </Button>
      </Container>
    )
  }

  // El backend actual devuelve el presupuesto inicial y el total por separado.
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

      <AlertaError
        mensaje={error?.message}
        onCerrar={() => setError(null)}
      />

      {error && (
        <Button
          color="primary"
          size="sm"
          className="mb-3"
          disabled={procesando}
          onClick={reintentar}
        >
          Volver a consultar
        </Button>
      )}

      <Row>
        <Col md="8">
          <Catalogo
            inventario={inventario}
            procesando={procesando}
            onAgregar={agregarSuministro}
          />
        </Col>

        <Col md="4">
          {/* Entregamos a la bodega las funciones de sus botones. */}
          <BodegaCarga
            inventario={inventario}
            itemsCargados={carga.itemsCargados}
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