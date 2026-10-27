import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Container, Row, Col } from 'reactstrap'
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
  confirmarCarga,
  reiniciarSesion,
} from './services/api.js'

// Consultamos ambos datos reales para mantenerlos sincronizados.
async function consultarMision() {
  const [inventario, carga] = await Promise.all([
    obtenerInventario(),
    obtenerCarga(),
  ])
  return { inventario, carga }
}

function App({ onSesionExpirada }) {
  const [inventario, setInventario] = useState([])
  const [carga, setCarga] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  // La referencia permite cancelar la espera al confirmar la misión.
  const temporizadorSesion = useRef(null)

  useEffect(() => {
    let activo = true

    function manejarFallo(fallo) {
      if (!activo) return
      setError(fallo)
      if (fallo.expirada) onSesionExpirada?.()
    }

    async function vigilarSesion() {
      const sesion = await obtenerSesion()
      if (!activo) return false

      clearTimeout(temporizadorSesion.current)
      if (sesion.confirmada) {
        // También reconoce una confirmación hecha en otra pestaña.
        setCarga((actual) => actual ? { ...actual, confirmada: true } : actual)
        return true
      }
      if (sesion.tiempoRestante <= 0) {
        onSesionExpirada?.()
        return false
      }

      // Al llegar al límite consultamos al servidor antes de cerrar.
      // Así una confirmación aceptada justo antes del límite se conserva.
      temporizadorSesion.current = setTimeout(() => {
        vigilarSesion().catch(manejarFallo)
      }, sesion.tiempoRestante)
      return true
    }

    async function cargarMision() {
      try {
        if (!await vigilarSesion()) return
        const datos = await consultarMision()
        if (!activo) return

        setInventario(datos.inventario)
        setCarga(datos.carga)
        setError(null)
      } catch (fallo) {
        manejarFallo(fallo)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarMision()
    return () => {
      activo = false
      clearTimeout(temporizadorSesion.current)
    }
  }, [intento, onSesionExpirada])

  function reintentar() {
    setCargando(true)
    setError(null)
    setIntento((actual) => actual + 1)
  }

  // Todas las acciones actualizan inventario, carga, costo y créditos.
  async function ejecutarAccion(accion) {
    if (procesando || cargando || carga?.confirmada) return
    setProcesando(true)
    setError(null)

    try {
      const respuesta = await accion()
      if (respuesta?.confirmada) {
        clearTimeout(temporizadorSesion.current)
        // Conservamos la confirmación aunque falle la consulta posterior.
        setCarga(respuesta)
      }
      const datos = await consultarMision()
      setInventario(datos.inventario)
      setCarga(datos.carga)
    } catch (fallo) {
      setError(fallo)
      if (fallo.expirada) onSesionExpirada?.()
    } finally {
      setProcesando(false)
    }
  }

  function agregarSuministro(id) {
    return ejecutarAccion(() => agregarACarga(id, 1))
  }

  // La cantidad enviada es el total deseado, no una diferencia.
  function actualizarCantidad(id, nuevaCantidad) {
    return ejecutarAccion(() => actualizarUnidades(id, nuevaCantidad))
  }

  function desembarcar(id) {
    return ejecutarAccion(() => eliminarSuministro(id))
  }

  function confirmarEquipamiento() {
    return ejecutarAccion(confirmarCarga)
  }

  async function iniciarNuevaMision() {
    if (procesando) return
    setProcesando(true)
    setError(null)
    try {
      await reiniciarSesion()
      // El efecto vuelve a consultar los datos y programa el nuevo plazo.
      reintentar()
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

  // El presupuesto inicial y el total se reciben por separado.
  const creditosDisponibles = carga.creditos - carga.total
  const confirmada = carga.confirmada === true
  const controlesBloqueados = procesando || confirmada

  return (
    <Container className="py-4 text-start">
      <PanelMision creditos={creditosDisponibles} total={carga.total} />

      {confirmada && (
        <Alert color="success" role="status">
          <h2 className="h5">Equipamiento confirmado</h2>
          <p>La misión está lista. Los suministros quedaron reservados.</p>
          <Button
            color="success"
            disabled={procesando}
            onClick={iniciarNuevaMision}
          >
            Iniciar nueva misión
          </Button>
        </Alert>
      )}

      {procesando && (
        <p role="status" className="text-info">Calculando peso…</p>
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
            procesando={controlesBloqueados}
            onAgregar={agregarSuministro}
          />
        </Col>
        <Col md="4">
          <BodegaCarga
            inventario={inventario}
            itemsCargados={carga.itemsCargados}
            creditosDisponibles={creditosDisponibles}
            procesando={controlesBloqueados}
            onActualizar={actualizarCantidad}
            onEliminar={desembarcar}
          />
          {!confirmada && (
            <Button
              color="success"
              className="mt-3 w-100"
              disabled={procesando || carga.itemsCargados.length === 0}
              onClick={confirmarEquipamiento}
            >
              Confirmar equipamiento
            </Button>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default App
