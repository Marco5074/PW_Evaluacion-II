import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, beforeEach, test } from "node:test";
import app from "../app.js";
import { inventario, restablecerEstadoInicial } from "../data/inventario.js";
import { DURACION_SESION_MS, reiniciarTemporizadorSesion } from "../middleware/sesion.js";

let server;
let baseUrl;
let reloj;
const ahoraReal = Date.now;

// Un reloj controlado permite probar cinco minutos sin hacer esperar al equipo.
before(async () => {
  reloj = ahoraReal();
  Date.now = () => reloj;
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => {
  reloj = ahoraReal();
  restablecerEstadoInicial();
  reiniciarTemporizadorSesion();
});
after(async () => {
  Date.now = ahoraReal;
  restablecerEstadoInicial();
  reiniciarTemporizadorSesion();
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function pedir(method, ruta, body) {
  const response = await fetch(baseUrl + ruta, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, data: await response.json() };
}
const agregar = (equipoId, cantidad) => pedir("POST", "/api/carga/agregar", { equipoId, cantidad });
const actualizar = (id, cantidad) => pedir("PUT", `/api/carga/actualizar-unidades/${id}`, { cantidad });
const verCarga = () => pedir("GET", "/api/carga");
const verInventario = () => pedir("GET", "/api/inventario");
const stock = async (id) => (await verInventario()).data.find((item) => item.id === id).stock;

test("GET: inventario completo y misión inicial", async () => {
  const productos = await verInventario();
  assert.equal(productos.status, 200);
  assert.equal(productos.data.length, 7);
  assert.ok(productos.data.every((p) => ["id", "nombre", "precio", "stock", "categoria"].every((k) => k in p)));
  assert.deepEqual((await verCarga()).data, {
    creditos: 500, itemsCargados: [], total: 0, confirmada: false,
  });
});

test("POST, PUT y DELETE conservan todas las unidades y recalculan el total", async () => {
  assert.equal((await agregar(201, 3)).data.total, 150);
  assert.equal(await stock(201), 2);
  assert.equal((await actualizar(201, 5)).data.total, 250);
  assert.equal(await stock(201), 0);
  assert.equal((await actualizar(201, 1)).data.total, 50);
  assert.equal(await stock(201), 4);
  assert.equal((await pedir("DELETE", "/api/carga/eliminar/201")).data.total, 0);
  assert.equal(await stock(201), 5);
  assert.deepEqual((await verCarga()).data.itemsCargados, []);
});

test("rechaza cantidades inválidas, cuerpos vacíos y suministros inexistentes", async () => {
  for (const cantidad of [-1, 0, 1.5, "2", null]) {
    assert.equal((await agregar(201, cantidad)).status, 400);
  }
  assert.equal((await pedir("POST", "/api/carga/agregar")).status, 400);
  assert.equal((await agregar(999, 1)).status, 404);
  await agregar(201, 1);
  for (const cantidad of [-1, 1.5, "2", null]) {
    assert.equal((await actualizar(201, cantidad)).status, 400);
  }
  assert.equal((await pedir("PUT", "/api/carga/actualizar-unidades/201")).status, 400);
  assert.equal((await actualizar(202, 1)).status, 404);
  assert.equal((await actualizar(201, 0)).data.total, 0);
  assert.equal(await stock(201), 5);
});

test("el exceso de stock responde 400 sin modificar datos", async () => {
  const antes = (await verCarga()).data;
  const fallo = await agregar(201, 10);
  assert.equal(fallo.status, 400);
  assert.equal(fallo.data.mensaje, "Stock en base insuficiente");
  assert.deepEqual((await verCarga()).data, antes);
  await agregar(201, 2);
  const subida = await actualizar(201, 6);
  assert.equal(subida.status, 400);
  assert.equal(await stock(201), 3);
  assert.equal((await verCarga()).data.itemsCargados[0].cantidad, 2);
});

test("POST y PUT rechazan sobrepasar los 500 créditos y conservan la carga", async () => {
  await agregar(201, 1);
  await agregar(206, 1);
  await agregar(207, 3);
  const antes = (await verCarga()).data;
  assert.equal(antes.total, 410);
  for (const respuesta of [await agregar(201, 2), await actualizar(201, 3)]) {
    assert.equal(respuesta.status, 400);
    assert.equal(respuesta.data.mensaje, "Créditos insuficientes para esta cantidad");
  }
  assert.deepEqual((await verCarga()).data, antes);
  assert.equal(await stock(201), 4);
});

test("confirmar cierra la carga sin duplicar descuentos y permite otra misión", async () => {
  assert.equal((await pedir("POST", "/api/carga/confirmar")).status, 400);
  await agregar(201, 2);
  const confirmacion = await pedir("POST", "/api/carga/confirmar");
  assert.equal(confirmacion.status, 200);
  assert.equal(confirmacion.data.confirmada, true);
  assert.equal(confirmacion.data.total, 100);
  assert.equal(await stock(201), 3);
  assert.equal((await pedir("POST", "/api/carga/confirmar")).status, 200);
  assert.equal(await stock(201), 3);
  for (const respuesta of [
    await agregar(202, 1), await actualizar(201, 1),
    await pedir("DELETE", "/api/carga/eliminar/201"),
  ]) {
    assert.equal(respuesta.status, 409);
    assert.match(respuesta.data.mensaje, /confirmada/);
  }
  // La misión ya se completó: al pasar el plazo sigue visible y reservada.
  reloj += DURACION_SESION_MS + 1;
  assert.equal((await verCarga()).status, 200);
  assert.equal((await pedir("GET", "/api/sesion")).data.confirmada, true);
  assert.equal((await pedir("POST", "/api/sesion/reiniciar")).status, 200);
  assert.deepEqual((await verCarga()).data, {
    creditos: 500, itemsCargados: [], total: 0, confirmada: false,
  });
  assert.equal(await stock(201), 5);
  assert.equal((await agregar(201, 1)).status, 200);
});

test("una misión sin confirmar expira y se puede reiniciar con todo restaurado", async () => {
  const originales = inventario.map(({ id, stock }) => ({ id, stock }));
  await agregar(201, 2);
  await agregar(206, 1);
  reloj += DURACION_SESION_MS + 1;
  for (const ruta of ["/api/carga", "/api/inventario", "/api/sesion"]) {
    const respuesta = await pedir("GET", ruta);
    assert.equal(respuesta.status, 403);
    assert.equal(respuesta.data.expirada, true);
  }
  assert.equal((await pedir("POST", "/api/carga/confirmar")).status, 403);
  const reinicio = await pedir("POST", "/api/sesion/reiniciar");
  assert.equal(reinicio.status, 200);
  assert.equal(reinicio.data.tiempoRestante, DURACION_SESION_MS);
  assert.deepEqual((await verCarga()).data, {
    creditos: 500, itemsCargados: [], total: 0, confirmada: false,
  });
  assert.deepEqual((await verInventario()).data.map(({ id, stock }) => ({ id, stock })), originales);
});

test("el reactor valida entradas, orienta los intentos y se reinicia", async () => {
  for (const temperatura of [0, 101, "50", null, 10.5]) {
    const respuesta = await pedir("POST", "/adjust", { temperatura });
    assert.equal(respuesta.status, 400);
    assert.equal(typeof respuesta.data.mensaje, "string");
    assert.equal("error" in respuesta.data, false);
  }
  assert.equal((await pedir("POST", "/adjust")).status, 400);
  async function acertar() {
    let minimo = 1, maximo = 100;
    for (let i = 0; i < 7; i++) {
      const temperatura = Math.floor((minimo + maximo) / 2);
      const respuesta = await pedir("POST", "/adjust", { temperatura });
      assert.equal(respuesta.status, 200);
      if (respuesta.data.mensaje === "estabilizado") return;
      if (respuesta.data.mensaje === "más alta") minimo = temperatura + 1;
      else {
        assert.equal(respuesta.data.mensaje, "más baja");
        maximo = temperatura - 1;
      }
    }
    assert.fail("El reactor debe poder estabilizarse con un entero entre 1 y 100");
  }
  await acertar();
  assert.equal((await pedir("POST", "/reboot")).status, 200);
  await acertar();
});

test("JSON incorrecto y rutas inexistentes también devuelven mensaje", async () => {
  const response = await fetch(baseUrl + "/adjust", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{",
  });
  assert.equal(response.status, 400);
  assert.equal(typeof (await response.json()).mensaje, "string");
  const desconocida = await pedir("GET", "/ruta-inexistente");
  assert.equal(desconocida.status, 404);
  assert.equal(desconocida.data.mensaje, "Ruta no encontrada");
});
