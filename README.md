# ✦ Tocar Madera — Backend REST con Node.js/Express

> Artesanía chilena en madera nativa · Módulo 6 · Curso FullStack JavaScript Profesor: Fabian Torres  
> Autor: Jorge Bosch | Aprendiz Fullstack Javascript · © 2026

---

## ¿Qué es este proyecto?

**Tocar Madera** es una tienda e-commerce de artesanía chilena en madera nativa, construida como ejercicio de portafolio para el Módulo 6 del curso PF1163.

El proyecto implementa una **API RESTful** con Node.js y Express que se comunica con un frontend estático. Los datos se persisten en archivos JSON usando el módulo File System (fs) de Node.js, sin base de datos externa.

---

## Estructura del Proyecto

```
m6-backend/
├── data/
│   ├── productos.json       ← base de datos de productos
│   └── ventas.json          ← registro de ventas
├── public/                  ← frontend estático
│   ├── index.html
│   ├── data/
│   │   └── productos.json
│   └── assets/
│       ├── css/
│       │   └── style.css
│       └── js/
│           └── app.js
├── server.js                ← corazón del backend
├── package.json
└── README.md
```

---
## Tecnologías Utilizadas

| Tecnología | Rol |
|---|---|
| Node.js | Entorno de ejecución del servidor |
| Express | Framework web para la API REST |
| File System (fs) | Persistencia de datos en archivos JSON |
| UUID | Generación de identificadores únicos |
| Nodemon | Reinicio automático en desarrollo |
| Bootstrap 5 | Estilos y componentes del frontend |
| Raleway (Google Fonts) | Tipografía Bauhaus del frontend |

---
## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/m6-backend.git
cd m6-backend
```
### 2. Instalar dependencias

```bash
npm install
```
### 3. Ejecutar en desarrollo

```bash
npm run dev
```
### 4. Ejecutar en producción

```bash
npm start
```
El servidor estará disponible en: `http://localhost:3000`

---

## Scripts disponibles

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## Endpoints de la API

### `GET /productos`
Retorna todos los productos con su stock actualizado.

```bash
curl http://localhost:3000/productos
```

**Respuesta exitosa:** `200 OK`
```json
[
  {
    "id": "a214c55f-...",
    "nombre": "Bandeja de Alerce Patagónico",
    "artesano": "Rosa Antimán, Osorno",
    "precio": 28900,
    "stock": 8
  }
]
```

---

### `POST /producto`
Crea un nuevo producto. Requiere `nombre`, `precio` y `stock`.

```bash
# En PowerShell
$body = '{"nombre":"Cuenco Raulí","precio":19500,"stock":10}'
curl -X POST http://localhost:3000/producto -H "Content-Type: application/json" -d $body
```

**Respuesta exitosa:** `201 Created`
```json
{
  "id": "uuid-generado-...",
  "nombre": "Cuenco Raulí",
  "precio": 19500,
  "stock": 10
}
```
**Error — datos incompletos:** `400 Bad Request`
```json
{ "error": "Faltan datos: nombre, precio y stock son obligatorios" }
```
---

### `PUT /producto`
Actualiza un producto existente. Requiere `id`. Los demás campos son opcionales.

```bash
# En PowerShell
$body = '{"id":"UUID-AQUI","precio":22000}'
curl -X PUT http://localhost:3000/producto -H "Content-Type: application/json" -d $body
```

**Respuesta exitosa:** `200 OK` — retorna el producto actualizado.

**Error — no encontrado:** `404 Not Found`
```json
{ "error": "Producto no encontrado" }
```

> **Nota pedagógica:** Se usa `!= null` en vez de `!valor` para validar los campos opcionales. Esto evita que un precio igual a `0` sea descartado incorrectamente, ya que `!0` evalúa como `true` en JavaScript.

---

### `DELETE /producto`
Elimina un producto por su `id`.

```bash
# En PowerShell
$body = '{"id":"UUID-AQUI"}'
curl -X DELETE http://localhost:3000/producto -H "Content-Type: application/json" -d $body
```

**Respuesta exitosa:** `200 OK`
```json
{
  "mensaje": "Producto eliminado",
  "producto": { ... }
}
```
---

### `GET /ventas`
Retorna todas las ventas registradas.

```bash
curl http://localhost:3000/ventas
```
**Respuesta exitosa:** `200 OK`
---

### `POST /venta`
Registra una nueva venta. Recibe un carrito con `id` y `cantidad` por producto. Descuenta el stock automáticamente y genera un UUID para la venta.

```bash
# En PowerShell
$body = '{"carrito":[{"id":"UUID-PRODUCTO","cantidad":2}]}'
curl -X POST http://localhost:3000/venta -H "Content-Type: application/json" -d $body
```

**Respuesta exitosa:** `201 Created`
```json
{
  "id": "uuid-venta-...",
  "fecha": "2026-02-19T23:37:37.433Z",
  "carrito": [ { "id": "...", "cantidad": 2 } ],
  "total": 57800
}
```

**Error — stock insuficiente:** `409 Conflict`
```json
{ "error": "Stock insuficiente para Bandeja de Alerce Patagónico" }
```
---
## Códigos de Estado HTTP

| Código | Nombre | Cuándo se usa |
|---|---|---|
| `200` | OK | Consulta, actualización o eliminación exitosa |
| `201` | Created | Se creó un recurso nuevo (POST exitoso) |
| `400` | Bad Request | El cliente envió datos incorrectos o incompletos |
| `404` | Not Found | El recurso solicitado no existe |
| `409` | Conflict | Stock insuficiente para completar la venta |
| `500` | Internal Server Error | Error inesperado en el servidor |

---

## Conceptos Clave

### ¿Por qué async/await?

Node.js es asíncrono por naturaleza. Las operaciones de archivo (leer/escribir JSON) toman tiempo y no deben bloquear el servidor mientras se ejecutan. `async/await` permite escribir código asíncrono de forma legible:

```js
// Versión moderna con async/await
const productos = await leerJson(FILE_PROD);
```

**Regla fundamental:** Si una función usa `await` adentro, su definición debe tener `async`. Y si puede fallar, siempre va dentro de un `try/catch`.

---

### Principio DRY — Don't Repeat Yourself

Todos los endpoints leen y escriben archivos. En vez de repetir esa lógica 6 veces, se extrae en dos funciones reutilizables:

```js
const leerJson     = async (file) => JSON.parse(await fs.readFile(file, 'utf-8'));
const escribirJson = async (file, data) =>
  fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
```

El `null, 2` en `JSON.stringify` hace que el archivo quede indentado y legible.

---

### Flujo de una petición

```
CLIENTE (frontend)                    SERVIDOR (Express)
──────────────────────────────────────────────────────
1. fetch('POST /venta', carrito) ──►  app.post('/venta', ...)
                                      2. Validar carrito
                                      3. Verificar stock → 409 si insuficiente
                                      4. Descontar stock
                                      5. Calcular total
                                      6. Guardar productos.json
                                      7. Guardar ventas.json
{ id, fecha, total }          ◄──────  8. res.status(201).json(nuevaVenta)
```
---
### Probar la API en PowerShell

En PowerShell las comillas simples tratan el contenido como texto literal. El patrón correcto para enviar JSON es:

```powershell
# ✅ Correcto — guardar JSON en variable con comillas simples
$body = '{"nombre":"Producto","precio":9990,"stock":5}'
curl -X POST http://localhost:3000/producto -H "Content-Type: application/json" -d $body

# ❌ Incorrecto — las comillas escapadas fallan en PowerShell
curl -X POST ... -d "{\"nombre\":\"Producto\"}"
```
---

## GitHub Pages

El frontend estático ubicado en `/public` puede desplegarse en GitHub Pages para visualización. El backend debe ejecutarse localmente o en un servidor externo (Railway, Render, etc.).

Para activar GitHub Pages en el repositorio:

```
Settings → Pages → Branch: main → Folder: /public → Save
```

La URL del sitio será: `https://TU-USUARIO.github.io/m6-backend/`
---

## Recursos de Apoyo

- [Documentación Express](https://expressjs.com/es/)
- [Módulo fs de Node.js](https://nodejs.org/api/fs.html)
- [Paquete UUID](https://www.npmjs.com/package/uuid)
- [Bootstrap 5](https://getbootstrap.com/)
- [Códigos de estado HTTP — MDN](https://developer.mozilla.org/es/docs/Web/HTTP/Status)

---

*Evidencia académica — Módulo 6 · Curso FullStack JavaScript · © 2026 Jorge Bosch*
