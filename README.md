# Evaluación II - Programación Web

Aplicación del equipo formada por **Estabiliza el Reactor** y **AstroLogistics**.
El backend usa Express; el frontend usa React, Vite, Bootstrap y Reactstrap.

## Requisitos

- Node.js **22.12 o posterior** y npm. Verificar con `node --version` y `npm --version`.
- Git para obtener el repositorio.
- Puertos locales 3000 (API) y 5173 (interfaz) disponibles.
- No requiere base de datos ni archivo `.env`. Los datos se guardan en memoria.

## Descargar e instalar desde cero

Para probar el trabajo del equipo en otra carpeta o computadora:

```powershell
git clone https://github.com/Marco5074/PW_Evaluacion-II.git
cd PW_Evaluacion-II
git checkout develop
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
```

Los comandos se ejecutan desde la carpeta principal, donde están `backend/` y
`frontend/`. En Linux o macOS se usa `npm` en lugar de `npm.cmd`.
`ci` instala las versiones exactas de los archivos `package-lock.json`.
La instalación se hace al clonar y cuando cambian las dependencias; no en cada arranque.

## Ejecutar

Abrir **dos terminales** en la carpeta principal.

Terminal 1, servidor de datos:

```powershell
npm.cmd --prefix backend run dev
```

Terminal 2, interfaz:

```powershell
npm.cmd --prefix frontend run dev
```

Abrir **http://localhost:5173**. Si Vite indica otro puerto, usar su dirección.
El puerto 3000 sirve la API; entrar a su raíz no abre la aplicación.
Para detener cada servidor, pulsar Ctrl + C (y responder S si Windows lo pregunta).

## Cómo usar los ejercicios

### Ejercicio 1: Estabiliza el Reactor

Ingresar un entero entre 1 y 100 y pulsar **Ajustar**. La respuesta indica si
la temperatura ideal es más alta o más baja. Al acertar se muestra la victoria y
se bloquean los intentos. **Reiniciar** solicita otra temperatura y limpia el historial.

### Ejercicio 2: Bodega de la nave

- La misión inicia con **500 créditos**, carga vacía y stock limitado.
- **Añadir a la Nave** reserva unidades, aumenta el costo y reduce los créditos disponibles.
- **+** y **−** ajustan la cantidad total. Para retirar la última unidad se usa **Desembarcar**.
- **Desembarcar** devuelve todas las unidades de ese suministro a la base.
- El servidor rechaza los excesos de stock o presupuesto; la página muestra una alerta.
- **Confirmar equipamiento** completa la misión y bloquea la carga. Las unidades ya
  reservadas permanecen descontadas; confirmar no vuelve a descontarlas.
- Una carga confirmada permanece visible aunque transcurra el plazo. **Iniciar nueva misión**
  restaura el stock, la carga vacía, los 500 créditos y el tiempo disponible.

La ventana dura **cinco minutos desde que arranca el backend o se reinicia la misión**.
La página consulta el tiempo restante y muestra el vencimiento automáticamente si la
carga sigue sin confirmar. **Empezar de nuevo** permite volver a comenzar después de expirar.
Recargar la página conserva los datos del servidor; reiniciar el proceso del backend
restablece todos los datos. Esta evaluación usa una misión compartida por la instancia
del servidor, sin cuentas individuales ni persistencia al cerrar el proceso.

## Comprobar el proyecto

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Las pruebas del backend levantan una instancia propia en un puerto libre. Comprueban
las cinco rutas obligatorias, cantidades inválidas, stock, créditos, reactor,
confirmación, bloqueo de cambios y reinicio después de expirar. Un reloj controlado
permite verificar el vencimiento sin esperar cinco minutos y sin usar la misión abierta.

Para completar la revisión visual:

1. Añadir un tanque: cantidad 1, stock 4, total 50 y créditos disponibles 450.
2. Pulsar + y − y comprobar que todos los valores cambien sin recargar.
3. Desembarcar: stock 5, total 0 y créditos disponibles 500.
4. Añadir y confirmar: ver el mensaje de misión lista y los controles bloqueados.
5. Iniciar nueva misión: carga vacía, total 0, 500 créditos y stock original.
6. Dejar una misión sin confirmar hasta que venza y usar Empezar de nuevo.
7. Acertar la temperatura del reactor y comprobar que Reiniciar limpia el juego.
8. Revisar el catálogo y la bodega con una ventana estrecha.

El build genera `frontend/dist/`, ignorado por Git.
`npm.cmd --prefix frontend run preview` sirve ese build para revisión local;
la API del backend debe continuar encendida.

## Postman

Importar `postman/Evaluacion-II.postman_collection.json`. La variable
`baseUrl` vale `http://localhost:3000` y se puede cambiar en Postman.
Usar **Run collection** para ejecutar las peticiones en el orden incluido.
La colección comienza y termina reiniciando la misión de la API seleccionada:
ejecutarla sobre una instancia de desarrollo destinada a pruebas.

Incluye las cinco rutas obligatorias, errores de stock/créditos/cantidades,
confirmación, bloqueo de modificaciones, sesión y reactor.
El vencimiento se comprueba automáticamente con `npm.cmd --prefix backend test`.

## API y acuerdos de datos

| Método | Ruta | Entrada o resultado principal |
| --- | --- | --- |
| GET | /api/inventario | Arreglo de id, nombre, precio, stock y categoria |
| GET | /api/carga | creditos, itemsCargados, total y confirmada |
| POST | /api/carga/agregar | { equipoId, cantidad } |
| PUT | /api/carga/actualizar-unidades/:id | { cantidad } con el nuevo total de unidades |
| DELETE | /api/carga/eliminar/:id | Retira el suministro y devuelve el stock |
| POST | /api/carga/confirmar | Confirma una carga no vacía, sin descontar stock otra vez |
| GET | /api/sesion | tiempoRestante en milisegundos y confirmada |
| POST | /api/sesion/reiniciar | Reinicia créditos, carga, stock y plazo |
| POST | /adjust | { temperatura }; responde { mensaje } |
| POST | /reboot | Genera otra temperatura |

`creditos` es el presupuesto inicial: la interfaz calcula lo disponible como
`creditos - total`. `itemsCargados` guarda solamente `{ id, cantidad }`;
los nombres y precios se buscan en el inventario. `confirmada` es un booleano.
Los errores responden `{ mensaje }`; el vencimiento añade `expirada: true`
y usa estado 403. Intentar modificar una carga confirmada responde 409.
La confirmación es una ruta adicional; se conservan las cinco rutas obligatorias.
En el frontend, `api.js` adapta el mensaje del reactor a `resultado`, que es
el nombre utilizado por su pantalla.

## Organización y defensa

- `backend/app.js`: configura Express y las rutas; permite probar sin ocupar el puerto 3000.
- `backend/server.js`: enciende la API.
- `backend/data/`: inventario, carga y restauración de los datos.
- `backend/controllers/`: reglas de stock, presupuesto, confirmación, sesión y reactor.
- `backend/middleware/`: comprobación del plazo.
- `backend/tests/`: pruebas automáticas de la API.
- `frontend/src/Principal.jsx`: menú y pantalla de sesión expirada.
- `frontend/src/App.jsx`: estado e integración de la bodega.
- `frontend/src/components/`: panel, catálogo, bodega, alertas y reactor.
- `frontend/src/services/api.js`: comunicación con el backend.
- `postman/`: colección para ejecutar las peticiones manualmente.

Reparto original: Marcos (backend principal), Leila (reactor y sesión del backend),
Ulises (integración y bodega del frontend) y Michelle (reactor, catálogo, alertas y menú).
Los commits registran también las correcciones e integraciones posteriores.

Para la defensa, todos deben poder explicar los recorridos completos: botón → API →
validación → cambio de datos → respuesta → actualización de React. Repasar especialmente
la diferencia del PUT, la devolución de stock, el presupuesto, las promesas, los hooks,
la confirmación y el vencimiento de la misión.
