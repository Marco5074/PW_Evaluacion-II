import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardBody,
  Form,
  FormGroup,
  Input,
  Label,
  ListGroup,
  ListGroupItem,
} from 'reactstrap'
import AlertaError from './AlertaError.jsx'
import { ajustarTemperatura, reiniciarReactor } from '../services/api.js'

//quita tildes y mayúsculas para que "más alta" y "mas alta" valgan igual.
function normalizar(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

//convierte el "resultado" del servidor en un texto para el usuario.
function textoDelResultado(resultado) {
  const limpio = normalizar(resultado)

  if (limpio === 'estabilizado') {
    return '¡Reactor estabilizado! Encontraste la temperatura correcta.'
  }

  if (limpio === 'mas alta') {
    return 'Temperatura insuficiente: la temperatura ideal es más alta.'
  }

  if (limpio === 'mas baja') {
    return 'Temperatura excesiva: la temperatura ideal es más baja.'
  }

  //si el servidor manda otro texto, lo mostramos tal cual
  return String(resultado)
}

function Reactor({ onSesionExpirada }) {
  //lo que el usuario escribe en el input (como texto)
  const [temperatura, setTemperatura] = useState('')

  //los tres estados que pide el enunciado:
  // historial = temperaturas ya probadas, mensaje = respuesta del servidor,
  // estabilizado = true cuando el usuario acierta (gano)
  const [historial, setHistorial] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [estabilizado, setEstabilizado] = useState(false)

  //estados de apoyo: error de validación/servidor y espera de la petición
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  //decide qué hacer cuando una petición falla
  function manejarFallo(fallo) {
    if (fallo.expirada) {
      //la sesión termino: la pantalla principal muestra "sesión expirada"
      onSesionExpirada?.()
      return
    }

    setError(fallo.message)
  }

  //se ejecuta al enviar el formulario (botón "Ajustar" o tecla Enter)
  async function manejarEnvio(evento) {
    evento.preventDefault()

    if (enviando || estabilizado) {
      return
    }

    //el input entrega texto; lo convertimos a número y lo validamos
    const valor = Number(temperatura)

    if (temperatura.trim() === '' || !Number.isInteger(valor)) {
      setError('Ingresa un número entero válido.')
      return
    }

    if (valor < 1 || valor > 100) {
      setError('La temperatura debe estar entre 1 y 100.')
      return
    }

    setEnviando(true)
    setError(null)

    try {
      //promesa: esperamos la respuesta de POST /adjust
      const datos = await ajustarTemperatura(valor)

      //guardamos el intento sin modificar el arreglo anterior
      setHistorial((anterior) => [...anterior, valor])
      setMensaje(textoDelResultado(datos.resultado))
      setEstabilizado(normalizar(datos.resultado) === 'estabilizado')
      setTemperatura('')
    } catch (fallo) {
      manejarFallo(fallo)
    } finally {
      setEnviando(false)
    }
  }

  //boton "reiniciar": pide una temperatura nueva y deja todo en blanco
  async function reiniciar() {
    if (enviando) {
      return
    }

    setEnviando(true)
    setError(null)

    try {
      await reiniciarReactor()

      setHistorial([])
      setMensaje('')
      setEstabilizado(false)
      setTemperatura('')
    } catch (fallo) {
      manejarFallo(fallo)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section>
      <h2>Estabiliza el Reactor</h2>
      <p>
        Adivina la temperatura de estabilización (entre 1 y 100). El servidor
        te dirá si la ideal es más alta, más baja o si ya la encontraste.
      </p>

      <AlertaError mensaje={error} onCerrar={() => setError(null)} />

      <Card className="mb-3">
        <CardBody>
          <Form onSubmit={manejarEnvio}>
            <FormGroup>
              <Label for="temperatura">Temperatura (°C)</Label>
              <Input
                id="temperatura"
                type="number"
                min="1"
                max="100"
                placeholder="Ej: 50"
                value={temperatura}
                disabled={estabilizado || enviando}
                onChange={(evento) => setTemperatura(evento.target.value)}
              />
            </FormGroup>

            <Button
              type="submit"
              color="primary"
              className="me-2"
              disabled={estabilizado || enviando}
            >
              Ajustar
            </Button>

            <Button
              type="button"
              color="secondary"
              outline
              disabled={enviando}
              onClick={reiniciar}
            >
              Reiniciar
            </Button>
          </Form>
        </CardBody>
      </Card>

      {/* Respuesta del servidor: verde si ganó, azul si todavía no. */}
      {mensaje && (
        <Alert color={estabilizado ? 'success' : 'info'}>{mensaje}</Alert>
      )}

      <h3 className="h5">Historial de intentos</h3>

      {historial.length === 0 ? (
        <p>Todavía no has probado ninguna temperatura.</p>
      ) : (
        <ListGroup>
          {/* map dibuja un elemento de la lista por cada temperatura probada. */}
          {historial.map((valor, indice) => (
            <ListGroupItem key={`${indice}-${valor}`}>
              Intento {indice + 1}: {valor} °C
            </ListGroupItem>
          ))}
        </ListGroup>
      )}
    </section>
  )
}

export default Reactor