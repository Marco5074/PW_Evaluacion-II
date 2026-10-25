// Dirección del servidor configurada en backend/server.js.
const API_URL = 'http://localhost:3000'

// Función compartida para enviar peticiones al servidor.
// "opciones" permite indicar el método y los datos que enviamos.
async function solicitar(ruta, opciones = {}) {
  let respuesta

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch {
    // Este error ocurre si no logramos comunicarnos con el servidor.
    throw new Error(
      'No se pudo conectar con el servidor. Comprueba que esté encendido.'
    )
  }

  // Convertimos la respuesta JSON en datos de JavaScript.
  // Una respuesta 204 significa que no hay contenido para leer.
  const datos =
    respuesta.status === 204 ? null : await respuesta.json()

  // fetch no considera automáticamente un 400 o 403 como un error.
  // Por eso comprobamos si el servidor aceptó la petición.
  if (!respuesta.ok) {
    const error = new Error(
      datos?.mensaje ?? 'No se pudo completar la operación.'
    )

    // Conservamos información para manejar errores y sesiones expiradas.
    error.estado = respuesta.status
    error.expirada = datos?.expirada === true

    // La pantalla podrá recibir este error mediante un catch.
    throw error
  }

  return datos
}

// Consulta todos los suministros con sus precios y stock.
export function obtenerInventario() {
  return solicitar('/api/inventario')
}

// Consulta los créditos, los suministros cargados y el costo total.
export function obtenerCarga() {
  return solicitar('/api/carga')
}

// Añade unidades de un suministro a la carga.
// Ejemplo: agregarACarga(201, 1).
export function agregarACarga(equipoId, cantidad) {
  return solicitar('/api/carga/agregar', {
    method: 'POST',
    body: JSON.stringify({ equipoId, cantidad }),
  })
}

// Cambia la cantidad TOTAL de un suministro ya cargado.
// Ejemplo: actualizarUnidades(201, 3) deja tres unidades en la nave.
export function actualizarUnidades(id, cantidad) {
  return solicitar(
    `/api/carga/actualizar-unidades/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ cantidad }),
    }
  )
}

// Elimina de la carga todas las unidades del suministro seleccionado.
export function eliminarSuministro(id) {
  return solicitar(
    `/api/carga/eliminar/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  )
}