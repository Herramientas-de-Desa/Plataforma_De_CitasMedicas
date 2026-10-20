// Prueba de navegador aislada. Servidor Vite con:
// VITE_SUPABASE_URL=https://medicitas-pruebas.supabase.co
// VITE_SUPABASE_ANON_KEY=clave-publica-de-pruebas
// Requiere Playwright; PLAYWRIGHT_MODULE permite usar una instalación externa.
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = 'http://127.0.0.1:5178';
const hostPrueba = 'medicitas-pruebas.supabase.co';
const idUsuario = '00000000-0000-4000-8000-000000000001';
const usuario = { id: idUsuario, aud: 'authenticated', role: 'authenticated', email: 'prueba@example.test' };
const clinicas = [
  { id_clinica: 1, nombre: 'Clínica Central', direccion: 'Av. Principal 100', telefono: '5550001', latitud: -14.067, longitud: -75.729 },
  { id_clinica: 2, nombre: 'Clínica del Valle', direccion: 'Av. del Valle 200', latitud: -14.09, longitud: -75.75 },
  { id_clinica: 3, nombre: 'Clínica sin coordenadas', direccion: 'Dirección pendiente', latitud: null, longitud: null },
];
const medicos = [
  { id_medico: 10, usuario_id: idUsuario, nombre: 'Dra. Ana Prueba', disponible: true, especialidad: { id_especialidad: 1, nombre: 'Medicina general' }, clinica: clinicas[0] },
  { id_medico: 11, nombre: 'Dr. Luis Prueba', disponible: true, especialidad: { id_especialidad: 1, nombre: 'Medicina general' }, clinica: clinicas[1] },
];
const horarios = Array.from({ length: 7 }, (_, i) => ({ id_horario: i + 1, dia_semana: i + 1, hora_inicio: '09:00:00', hora_fin: '10:00:00', medico_id: 10 }));
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const fallos = [];
const informes = [];
const capturas = [];

async function escenario(rol, geolocalizacion = 'concedida', movil = false) {
  const estado = { rol, solicitudes: [], escrituras: [] };
  const context = await browser.newContext({ viewport: movil ? { width: 390, height: 844 } : { width: 1366, height: 900 } });
  await context.addInitScript(({ rol, usuario, hostPrueba, geolocalizacion }) => {
    if (rol) {
      const payload = btoa(JSON.stringify({ sub: usuario.id, exp: Math.floor(Date.now() / 1000) + 86400, role: 'authenticated' }));
      localStorage.setItem(`sb-${hostPrueba.split('.')[0]}-auth-token`, JSON.stringify({
        access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.prueba`, refresh_token: 'solo-pruebas',
        expires_at: Math.floor(Date.now() / 1000) + 86400, token_type: 'bearer', user: usuario,
      }));
    }
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition: (ok, fallo) => setTimeout(() => {
        if (geolocalizacion === 'concedida') ok({ coords: { latitude: -14.0678, longitude: -75.7286, accuracy: 35 } });
        else fallo({ code: geolocalizacion === 'denegada' ? 1 : 2 });
      }, 40),
    } });
  }, { rol, usuario, hostPrueba, geolocalizacion });
  const perfil = () => ({ id_usuario: idUsuario, nombres: 'Ana Prueba', correo: usuario.email, rol: estado.rol, telefono: '' });
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === base) return route.continue();
    if (url.hostname !== hostPrueba) {
      // Ninguna petición externa toca la base real ni requiere mapas remotos.
      if (url.pathname.endsWith('.png')) return route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
      return route.fulfill({ contentType: 'text/css', body: '' });
    }
    estado.solicitudes.push(url.pathname + url.search);
    if (url.pathname.endsWith('/logout')) { estado.rol = null; return route.fulfill({ status: 204 }); }
    if (request.method() !== 'GET') {
      estado.escrituras.push(url.pathname);
      return route.fulfill({ status: 403, json: { message: 'Esta prueba no permite escrituras' } });
    }
    if (url.pathname.endsWith('/user')) return route.fulfill({ json: usuario });
    const tabla = url.pathname.split('/').pop();
    if (tabla === 'usuarios' && estado.errorPerfil) return route.fulfill({ status: 503, json: { message: 'Fallo temporal de prueba' } });
    if (tabla === 'usuarios' && estado.demoraPerfil) await new Promise(resolve => setTimeout(resolve, estado.demoraPerfil));
    let filas = tabla === 'usuarios' ? [perfil()] : tabla === 'clinicas' ? clinicas
      : tabla === 'medicos' ? medicos : tabla === 'especialidades' ? [{ id_especialidad: 1, nombre: 'Medicina general' }]
        : tabla === 'horarios' ? horarios : [];
    if (tabla === 'medicos') {
      if (url.searchParams.has('clinica_id')) filas = filas.filter(m => `eq.${m.clinica.id_clinica}` === url.searchParams.get('clinica_id'));
      if (url.searchParams.has('id_medico')) filas = filas.filter(m => `eq.${m.id_medico}` === url.searchParams.get('id_medico'));
      if (url.searchParams.has('usuario_id')) filas = filas.filter(m => m.usuario_id === idUsuario);
    }
    const singular = request.headers().accept?.includes('vnd.pgrst.object');
    return route.fulfill({ json: singular ? filas[0] || null : filas });
  });
  const page = await context.newPage();
  page.on('pageerror', e => fallos.push(e.message));
  async function abrir(ruta) {
    await page.goto(base + ruta);
    await page.locator('.mc-carga').waitFor({ state: 'hidden' });
    if (movil) await page.locator('.mc-toggle').click();
  }
  async function comprobar() {
    assert.equal(estado.escrituras.length, 0, 'No debe haber escrituras');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No debe desbordar horizontalmente');
  }
  return { context, page, estado, abrir, comprobar };
}

async function prueba(nombre, fn) {
  await fn();
  informes.push(nombre);
  console.log(`OK: ${nombre}`);
}

try {
  await prueba('Visitante: enlaces públicos, teclado, rutas protegidas y móvil', async () => {
    const s = await escenario(null, 'denegada', true);
    await s.abrir('/especialistas');
    const nav = await s.page.locator('.mc-navegacion').innerText();
    assert.match(nav, /Inicio/); assert.match(nav, /Crear cuenta/); assert.doesNotMatch(nav, /Mis citas|Mi agenda|Panel de control/);
    await s.page.keyboard.press('Escape');
    assert.equal(await s.page.locator('.mc-toggle').getAttribute('aria-expanded'), 'false');
    assert.equal(await s.page.locator('.mc-toggle').evaluate(el => el === document.activeElement), true);
    await s.page.keyboard.press('Enter');
    assert.equal(await s.page.locator('.mc-toggle').getAttribute('aria-expanded'), 'true');
    await s.page.locator('.mc-enlaces').getByRole('link', { name: 'Especialistas', exact: true }).click();
    assert.equal(await s.page.locator('.mc-toggle').getAttribute('aria-expanded'), 'false', 'Cerrar también al pulsar el enlace actual');
    for (const ruta of ['/admin', '/panel-medico', '/perfil', '/mis-citas', '/reservar/10']) {
      await s.page.goto(base + ruta);
      await s.page.waitForURL('**/login');
    }
    await s.comprobar();
    await s.context.close();
  });

  await prueba('Paciente: mapa, distancia, ficha, médico, reserva y cierre por Escape', async () => {
    const s = await escenario('paciente');
    await s.abrir('/clinicas');
    await s.page.getByText('Clínicas ordenadas por cercanía', { exact: true }).waitFor();
    assert.match(await s.page.locator('.mc-enlaces').innerText(), /Mapa de clínicas/);
    assert.equal(await s.page.locator('.clinica-marcador').count(), 2, 'Excluir coordenadas nulas del mapa');
    assert.equal(await s.page.locator('.clinica-mi-marcador').count(), 1);
    assert.match(await s.page.locator('.clinicas-leyenda').innerText(), /35 m/);
    assert.equal(await s.page.locator('.clinica-opcion').first().locator('strong').innerText(), 'Clínica Central');
    assert.equal(await s.page.locator('.clinica-marcador').first().evaluate(el => getComputedStyle(el).position), 'absolute');
    await s.page.locator('.clinica-marcador').first().click();
    await s.page.locator('.clinica-ficha .tarjeta-medico').waitFor();
    assert.equal(await s.page.locator('.clinica-ficha .tarjeta-medico').count(), 1);
    assert.match(await s.page.locator('.clinica-ficha').innerText(), /Dra. Ana Prueba/);
    await s.page.getByRole('button', { name: 'Ver horarios y reservar' }).click();
    await s.page.getByRole('dialog').waitFor();
    await s.page.getByRole('button', { name: '09:00', exact: true }).waitFor();
    await s.page.keyboard.press('Escape');
    await s.page.getByRole('dialog').waitFor({ state: 'hidden' });
    await s.comprobar();
    const captura = join(tmpdir(), 'medicitas-mapa-navbar.png');
    await s.page.evaluate(() => window.scrollTo(0, 0));
    await s.page.screenshot({ path: captura, fullPage: true }); capturas.push(captura);
    await s.page.goto(base + '/admin');
    await s.page.waitForURL(base + '/');
    await s.page.goto(base + '/panel-medico');
    await s.page.waitForURL(base + '/');
    await s.context.close();
  });

  await prueba('Mapa móvil: ubicación denegada/no disponible y elección manual', async () => {
    for (const ubicacion of ['denegada', 'no-disponible']) {
      const s = await escenario('paciente', ubicacion, true);
      await s.abrir('/clinicas');
      await s.page.locator('.mc-toggle').click();
      await s.page.locator('.clinicas-aviso').waitFor();
      assert.equal(await s.page.locator('.clinica-mi-marcador').count(), 0);
      await s.page.locator('.clinica-opcion').nth(1).click();
      await s.page.locator('.clinica-ficha .tarjeta-medico').waitFor();
      assert.match(await s.page.locator('.clinica-ficha').innerText(), /Dr. Luis Prueba/);
      await s.comprobar();
      if (ubicacion === 'denegada') {
        const captura = join(tmpdir(), 'medicitas-clinica-movil.png');
        await s.page.screenshot({ path: captura }); capturas.push(captura);
      }
      await s.context.close();
    }
  });

  await prueba('Médico: Mi atención enlaza al formulario existente y agenda real', async () => {
    const s = await escenario('medico');
    await s.abrir('/perfil');
    await s.page.getByRole('link', { name: 'Mi atención', exact: true }).click();
    await s.page.locator('#mi-atencion .mp-configuracion').waitFor();
    assert.equal(await s.page.getByRole('link', { name: 'Mi atención', exact: true }).getAttribute('aria-current'), 'page');
    await s.page.getByRole('button', { name: 'Editar atención y horarios' }).waitFor();
    await s.page.getByRole('link', { name: 'Mi agenda', exact: true }).click();
    await s.page.getByRole('heading', { name: 'Mi agenda', exact: true }).waitFor();
    assert.doesNotMatch(await s.page.locator('.mc-enlaces').innerText(), /Mis citas|Mapa de clínicas|Panel de control/);
    await s.comprobar();
    await s.page.setViewportSize({ width: 390, height: 844 });
    await s.page.locator('.mc-toggle').click();
    const captura = join(tmpdir(), 'medicitas-navbar-medico-movil.png');
    await s.page.screenshot({ path: captura }); capturas.push(captura);
    await s.page.getByRole('link', { name: 'Mi perfil profesional', exact: true }).click();
    await s.page.getByRole('heading', { name: 'Mi perfil profesional', exact: true }).waitFor();
    assert.equal(await s.page.locator('.mc-toggle').getAttribute('aria-expanded'), 'false');
    await s.comprobar();
    await s.page.goto(base + '/admin');
    await s.page.waitForURL(base + '/');
    await s.context.close();
  });

  await prueba('Administrador: secciones por URL, búsqueda ID/correo y atrás', async () => {
    const s = await escenario('admin');
    await s.abrir('/admin');
    await s.page.locator('.mc-admin-resumen').waitFor();
    await s.page.locator('.mc-admin-lateral').getByRole('link', { name: 'Médicos', exact: true }).click();
    await s.page.getByLabel('Buscar por ID, nombre o correo').fill('10');
    assert.match(await s.page.locator('.admin-tabla tbody').innerText(), /#10/);
    assert.doesNotMatch(await s.page.locator('.admin-tabla tbody').innerText(), /#11/);
    await s.page.getByLabel('Buscar por ID, nombre o correo').fill('prueba@example.test');
    assert.match(await s.page.locator('.admin-tabla tbody').innerText(), /#10/);
    await s.page.reload();
    await s.page.getByRole('heading', { name: 'Médicos registrados' }).waitFor();
    await s.page.locator('.mc-admin-lateral').getByRole('link', { name: 'Citas', exact: true }).click();
    await s.page.goBack();
    await s.page.getByRole('heading', { name: 'Médicos registrados' }).waitFor();
    await s.comprobar();
    const captura = join(tmpdir(), 'medicitas-admin-navbar.png');
    await s.page.screenshot({ path: captura, fullPage: true }); capturas.push(captura);
    await s.page.setViewportSize({ width: 390, height: 844 });
    await s.page.locator('.mc-admin-toggle').click();
    await s.page.locator('.mc-admin-lateral').getByRole('link', { name: 'Usuarios', exact: true }).click();
    assert.equal(await s.page.locator('.mc-admin-toggle').getAttribute('aria-expanded'), 'false');
    await s.comprobar();
    await s.context.close();
  });

  await prueba('Actualización de rol, menú de cuenta con teclado y cierre de sesión', async () => {
    const s = await escenario('paciente');
    s.estado.demoraPerfil = 500;
    await s.page.goto(base + '/especialistas');
    await s.page.locator('.mc-carga').waitFor();
    assert.equal(await s.page.locator('.mc-enlaces').count(), 0, 'No mostrar otro rol durante la carga');
    await s.page.locator('.mc-carga').waitFor({ state: 'hidden' });
    s.estado.demoraPerfil = 0;
    await s.abrir('/especialistas');
    s.estado.rol = 'medico';
    await s.page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await s.page.getByRole('link', { name: 'Mi atención', exact: true }).waitFor();
    s.estado.errorPerfil = true;
    const respuesta = s.page.waitForResponse(r => r.url().includes('/rest/v1/usuarios') && r.status() === 503);
    await s.page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await respuesta;
    assert.equal(await s.page.getByRole('link', { name: 'Mi atención', exact: true }).count(), 1, 'Mantener sesión ante fallo temporal');
    s.estado.errorPerfil = false;
    await s.page.locator('.mc-cuenta-boton').focus();
    await s.page.keyboard.press('Enter');
    await s.page.locator('#mc-menu-cuenta').waitFor();
    await s.page.keyboard.press('Escape');
    assert.equal(await s.page.locator('.mc-cuenta-boton').evaluate(el => el === document.activeElement), true);
    await s.page.locator('.mc-cuenta-boton').click();
    await s.page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await s.page.getByRole('link', { name: 'Iniciar sesión', exact: true }).waitFor();
    assert.doesNotMatch(await s.page.locator('.mc-navegacion').innerText(), /Mi atención/);
    await s.context.close();
  });

  assert.deepEqual(fallos, [], 'Sin errores de JavaScript en el navegador');
  console.log(JSON.stringify({ pruebas: informes.length, erroresNavegador: fallos, capturas }, null, 2));
} finally {
  await browser.close();
}
