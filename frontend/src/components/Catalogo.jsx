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
            <Card className="mb-3">
              <CardBody>
                <CardTitle tag="h5">{suministro.nombre}</CardTitle>

                <CardSubtitle className="mb-2 text-muted" tag="h6">
                  {suministro.categoria ?? 'Sin categoría'}
                </CardSubtitle>

                <p className="mb-2">
                  <Badge color="success">{suministro.precio} Cr</Badge>
                </p>

                <p className="mb-3">Stock disponible: {suministro.stock}</p>

                {/* sin stock: botón gris y desactivado. con stock: añade 1 unidad. */}
                {suministro.stock === 0 ? (
                  <Button color="secondary" disabled>
                    Agotado en Base
                  </Button>
                ) : (
                  <Button
                    color="primary"
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