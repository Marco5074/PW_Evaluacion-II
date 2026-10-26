import { useCallback, useState } from 'react'
import { Container, Nav, NavItem, NavLink } from 'reactstrap'
import App from './App.jsx'
import Reactor from './components/Reactor.jsx'
import SesionExpirada from './components/SesionExpirada.jsx'

//pantalla principal: menú con pestañas para cambiar entre los dos
// ejercicios y control de la sesión expirada
function Principal() {
  //pestaña activa: 'reactor' (Ejercicio 1) o 'bodega' (Ejercicio 2)
  const [vista, setVista] = useState('reactor')

  // true cuando el servidor respondió { expirada: true }
  const [expirada, setExpirada] = useState(false)

  //cambia al reiniciar la sesión. Se usa como "key" para que React
  // vuelva a montar el ejercicio 2 y pida los datos otra vez
  const [version, setVersion] = useState(0)

  // useCallback mantiene la misma función entre renders, así el useEffect
  // de App no se vuelve a ejecutar sin necesidad.
  const alExpirar = useCallback(() => setExpirada(true), [])

  function alReiniciar() {
    setExpirada(false)
    setVersion((actual) => actual + 1)
  }

  //sesion expirada: reemplaza todo por la pantalla de "empezar de nuevo"
  if (expirada) {
    return (
      <Container className="py-4">
        <SesionExpirada onReiniciar={alReiniciar} />
      </Container>
    )
  }

  return (
    <>
      <Container className="pt-4 text-start">
        <h1 className="h3">AstroLogistics Ltd.</h1>

        <Nav tabs>
          <NavItem>
            <NavLink
              tag="button"
              type="button"
              active={vista === 'reactor'}
              onClick={() => setVista('reactor')}
            >
              Ejercicio 1: Reactor
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              tag="button"
              type="button"
              active={vista === 'bodega'}
              onClick={() => setVista('bodega')}
            >
              Ejercicio 2: Bodega de la nave
            </NavLink>
          </NavItem>
        </Nav>
      </Container>

      {/* mostramos una pestaña y ocultamos la otra con d-none, así el
          historial del reactor y la carga no se pierden al cambiar */}
      <div className={vista === 'reactor' ? '' : 'd-none'}>
        <Container className="py-4 text-start">
          <Reactor onSesionExpirada={alExpirar} />
        </Container>
      </div>

      <div className={vista === 'bodega' ? '' : 'd-none'}>
        {/* App (Ejercicio 2) ya trae su propio Container. */}
        <App key={version} onSesionExpirada={alExpirar} />
      </div>
    </>
  )
}

export default Principal