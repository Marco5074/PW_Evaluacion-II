import {
  ListGroup,
  ListGroupItem,
  ButtonGroup,
  Button,
} from 'reactstrap'

// Recibimos los datos y las funciones que ejecutarán los botones.
function BodegaCarga({
  inventario,
  itemsCargados,
  creditosDisponibles,
  procesando,
  onActualizar,
  onEliminar,
}) {
  const puedeActualizar = typeof onActualizar === 'function'

  return (
    <section>
      <h2>Tu bodega de carga</h2>

      {itemsCargados.length === 0 ? (
        <p>La nave todavía no tiene suministros.</p>
      ) : (
        <ListGroup>
          {itemsCargados.map((item) => {
            // Buscamos el nombre, precio y stock del suministro.
            const suministro = inventario.find(
              (producto) => producto.id === item.id
            )

            // Solo permitimos aumentar si hay stock y dinero suficiente.
            const puedeAumentar =
              suministro &&
              suministro.stock > 0 &&
              suministro.precio <= creditosDisponibles

            return (
              <ListGroupItem key={item.id}>
                <p className="fw-bold">
                  {suministro?.nombre ?? 'Suministro desconocido'}
                </p>

                <p className="mb-2">
                  Cantidad: {item.cantidad}
                </p>

                <ButtonGroup size="sm" className="me-2">
                  {/* Restamos una unidad.
                      Para quitar la última se usa Desembarcar. */}
                  <Button
                    color="secondary"
                    disabled={procesando || !puedeActualizar || item.cantidad <= 1}
                    onClick={() =>
                      onActualizar(item.id, item.cantidad - 1)
                    }
                  >
                    −
                  </Button>

                  {/* Sumamos una unidad si las condiciones lo permiten. */}
                  <Button
                    color="secondary"
                    disabled={procesando || !puedeActualizar || !puedeAumentar}
                    onClick={() =>
                      onActualizar(item.id, item.cantidad + 1)
                    }
                  >
                    +
                  </Button>
                </ButtonGroup>

                {/* Quitamos todas las unidades de este suministro. */}
                <Button
                  color="danger"
                  outline
                  size="sm"
                  disabled={procesando}
                  onClick={() => onEliminar(item.id)}
                >
                  Desembarcar
                </Button>
              </ListGroupItem>
            )
          })}
        </ListGroup>
      )}
    </section>
  )
}

export default BodegaCarga