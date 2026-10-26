import {
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  Badge,
  Button,
} from 'reactstrap'

//catalogo de la base: una tarjeta por cada suministro del inventario
//recibe el inventario y la función que se ejecuta al añadir a la nave.
function Catalogo({ inventario, procesando, onAgregar }) {
  return (
    <section>
      <h2>Catálogo de la base</h2>

      <Row>
        {/* map recorre el arreglo y dibuja una tarjeta por suministro
            md="4" = 3 por fila en pantallas medianas; xs="12" = 1 por fila en móvil */}
        {inventario.map((suministro) => (
          <Col md="4" xs="12" key={suministro.id}>
            <Card className="mb-3 h-100">
              <CardBody className="d-flex flex-column">
                <CardTitle tag="h5" className="fs-6 fw-bold">
                  {suministro.nombre}
                </CardTitle>

                <CardSubtitle className="mb-2 text-muted small" tag="h6">
                  {suministro.categoria ?? 'Sin categoría'}
                </CardSubtitle>

                <p className="mb-2">
                  <Badge color="success">{suministro.precio} Cr</Badge>
                </p>

                <p className="mb-3 small">
                  Stock disponible: {suministro.stock}
                </p>

                {/* mt-auto empuja el botón al fondo para que todos queden alineados. */}
                {suministro.stock === 0 ? (
                  <Button color="secondary" disabled className="mt-auto w-100">
                    Agotado en Base
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    className="mt-auto w-100"
                    disabled={procesando}
                    onClick={() => onAgregar(suministro.id)}
                  >
                    Añadir a la Nave
                  </Button>
                )}
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  )
}

export default Catalogo