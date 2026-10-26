import { useCallback, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardSubtitle,
  CardText,
  CardTitle,
  Col,
  Container,
  Nav,
  Navbar,
  NavbarBrand,
  NavItem,
  NavLink,
  Row,
} from 'reactstrap'
import App from './App.jsx'
import Reactor from './components/Reactor.jsx'
import SesionExpirada from './components/SesionExpirada.jsx'

// Pantalla principal: barra de navegación, pantalla de inicio con los dos
// ejercicios y control de la sesión expirada.
function Principal() {
  // Pantalla activa: 'inicio', 'reactor' (Ejercicio 1) o 'bodega' (Ejercicio 2).
  const [vista, setVista] = useState('inicio')

  // true cuando el servidor respondió { expirada: true }.
  const [expirada, setExpirada] = useState(false)

  // Cambia al reiniciar la sesión. Se usa como "key" para que React
  // vuelva a montar el Ejercicio 2 y pida los datos otra vez.
  const [version, setVersion] = useState(0)

  // useCallback mantiene la misma función entre renders, así el useEffect
  // de App no se vuelve a ejecutar sin necesidad.
  const alExpirar = useCallback(() => setExpirada(true), [])

  function alReiniciar() {
    setExpirada(false)
    setVersion((actual) => actual + 1)
  }

  // Sesión expirada: reemplaza todo por la pantalla de "empezar de nuevo".
  if (expirada) {
    return (
      <Container className="py-4">
        <SesionExpirada onReiniciar={alReiniciar} />
      </Container>
    )
  }

  return (
    <>
      {/* Barra superior: siempre visible para cambiar de pantalla. */}
      <Navbar dark color="dark" expand className="px-3">
        <NavbarBrand>AstroLogistics Ltd.</NavbarBrand>

        <Nav className="ms-auto" navbar>
          <NavItem>
            <NavLink
              tag="button"
              type="button"
              active={vista === 'inicio'}
              onClick={() => setVista('inicio')}
            >
              Inicio
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              tag="button"
              type="button"
              active={vista === 'reactor'}
              onClick={() => setVista('reactor')}
            >
              Ejercicio 1
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              tag="button"
              type="button"
              active={vista === 'bodega'}
              onClick={() => setVista('bodega')}
            >
              Ejercicio 2
            </NavLink>
          </NavItem>
        </Nav>
      </Navbar>

      {/* Pantalla de inicio: dos tarjetas para elegir el ejercicio.
          flex-grow-1 + align-items-center centran el contenido en el espacio
          que queda debajo de la barra. */}
      {vista === 'inicio' && (
        <div className="flex-grow-1 d-flex align-items-center">
          <Container className="py-5 text-center">
            <h1 className="h3 mb-4">Elige un ejercicio</h1>

                        <Row className="justify-content-center">
              <Col md="6" xs="12">
                <Card className="mb-3 h-100">
                  <CardBody className="d-flex flex-column">
                    <CardSubtitle tag="h6" className="text-muted small mb-1">
                      Ejercicio 1
                    </CardSubtitle>
                    <CardTitle tag="h5">Estabiliza el Reactor</CardTitle>
                    <CardText>Adivina la temperatura correcta.</CardText>
                    <Button
                      color="primary"
                      className="mt-auto align-self-center"
                      onClick={() => setVista('reactor')}
                    >
                      Entrar
                    </Button>
                  </CardBody>
                </Card>
              </Col>

              <Col md="6" xs="12">
                <Card className="mb-3 h-100">
                  <CardBody className="d-flex flex-column">
                    <CardSubtitle tag="h6" className="text-muted small mb-1">
                      Ejercicio 2
                    </CardSubtitle>
                    <CardTitle tag="h5">Bodega de la nave</CardTitle>
                    <CardText>
                      Arma la carga con créditos y stock limitados.
                    </CardText>
                    <Button
                      color="primary"
                      className="mt-auto align-self-center"
                      onClick={() => setVista('bodega')}
                    >
                      Entrar
                    </Button>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      )}

      {/* Los dos ejercicios quedan montados y se ocultan con d-none, así el
          historial del reactor y la carga no se pierden al cambiar. */}
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