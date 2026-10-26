import { useState } from 'react'
import { Button, Card, CardBody } from 'reactstrap'
import AlertaError from './AlertaError.jsx'
import { reiniciarSesion } from '../services/api.js'

//pantalla que aparece cuando el servidor responde { expirada: true }
//invita a empezar de nuevo y llama a POST /api/sesion/reiniciar
function SesionExpirada({ onReiniciar }) {
  const [reiniciando, setReiniciando] = useState(false)
  const [error, setError] = useState(null)

  async function empezarDeNuevo() {
    setReiniciando(true)
    setError(null)

    try {
      //el servidor deja la carga vacía, 500 créditos y el stock original
      await reiniciarSesion()

      //avisamos a la pantalla principal para que vuelva a cargar todo
      onReiniciar()
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setReiniciando(false)
    }
  }

  return (
    <section className="text-center py-5">
      <AlertaError mensaje={error} onCerrar={() => setError(null)} />

      <Card>
        <CardBody>
          <h2>La ventana de lanzamiento se cerró</h2>
          <p>
            Se acabó el tiempo y la sesión expiró. Tu carga fue descartada,
            pero puedes armar una nueva desde cero.
          </p>

          <Button
            color="primary"
            disabled={reiniciando}
            onClick={empezarDeNuevo}
          >
            {reiniciando ? 'Reiniciando…' : 'Empezar de nuevo'}
          </Button>
        </CardBody>
      </Card>
    </section>
  )
}

export default SesionExpirada