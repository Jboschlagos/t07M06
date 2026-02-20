// ── Detectar entorno ──────────────────────────────────────
const EN_GITHUB_PAGES = window.location.hostname.includes('github.io');
const URL_PRODUCTOS = EN_GITHUB_PAGES ? './data/productos.json' : '/productos';

// ── Estado global ──────────────────────────────────────────
let carrito = [];
let productos = [];

// ── Formatear precio en pesos chilenos ────────────────────
const formatPrecio = (n) =>
    n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

// ── Renderizar tarjetas ────────────────────────────────────
const renderProductos = (lista) => {
    const grid = document.getElementById('gridProductos');

    if (lista.length === 0) {
        grid.innerHTML = `<p class="text-center text-muted w-100 py-5">No hay productos en esta categoría.</p>`;
        return;
    }

    grid.innerHTML = lista.map(p => `
    <div class="card-madera">
      <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
      <div class="card-body-madera">
        <p class="card-categoria">${p.categoria}</p>
        <h3 class="card-nombre">${p.nombre}</h3>
        <p class="card-artesano">por ${p.artesano}</p>
        <p class="card-desc">${p.descripcion}</p>
        <div class="card-footer-madera">
          <span class="card-precio">${formatPrecio(p.precio)}</span>
          <button class="btn-agregar" onclick="agregarAlCarrito('${p.id}')">
            + Agregar
          </button>
        </div>
        <span class="badge-stock">${p.stock} disponibles</span>
      </div>
    </div>
  `).join('');
};

// ── Cargar productos desde la API o JSON estático ─────────
const cargarProductos = async () => {
    try {
        const res = await fetch(URL_PRODUCTOS);
        productos = await res.json();
        renderProductos(productos);
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
};

// ── Filtro por categoría ───────────────────────────────────
document.getElementById('filtroCat').addEventListener('change', (e) => {
    const cat = e.target.value;
    const filtrados = cat === 'todos'
        ? productos
        : productos.filter(p => p.categoria === cat);
    renderProductos(filtrados);
});

// ── Agregar al carrito ─────────────────────────────────────
const agregarAlCarrito = (id) => {
    const producto = productos.find(p => p.id === id);
    const enCarrito = carrito.find(i => i.id === id);

    if (enCarrito) {
        if (enCarrito.cantidad >= producto.stock) return;
        enCarrito.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    actualizarBadge();
    renderCarrito();
};

// ── Quitar del carrito ─────────────────────────────────────
const quitarDelCarrito = (id) => {
    carrito = carrito.filter(i => i.id !== id);
    actualizarBadge();
    renderCarrito();
};

// ── Actualizar badge del navbar ────────────────────────────
const actualizarBadge = () => {
    const total = carrito.reduce((acc, i) => acc + i.cantidad, 0);
    document.getElementById('badgeCarrito').textContent = total;
};

// ── Renderizar contenido del modal ─────────────────────────
const renderCarrito = () => {
    const cuerpo = document.getElementById('cuerpoCarrito');
    const totalEl = document.getElementById('totalCarrito');

    if (carrito.length === 0) {
        cuerpo.innerHTML = `<p class="text-center text-muted py-3">Tu carrito está vacío.</p>`;
        totalEl.textContent = '$0';
        return;
    }

    cuerpo.innerHTML = carrito.map(i => `
    <div class="item-carrito">
      <div>
        <p class="item-nombre">${i.nombre}</p>
        <p class="item-precio">${formatPrecio(i.precio)} × ${i.cantidad}</p>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span>${formatPrecio(i.precio * i.cantidad)}</span>
        <button class="btn-quitar" onclick="quitarDelCarrito('${i.id}')">✕</button>
      </div>
    </div>
  `).join('');

    const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    totalEl.textContent = formatPrecio(total);
};

// ── Abrir modal carrito ────────────────────────────────────
document.getElementById('btnCarrito').addEventListener('click', () => {
    renderCarrito();
    const modal = new bootstrap.Modal(document.getElementById('modalCarrito'));
    modal.show();
});

// ── Comprar ────────────────────────────────────────────────
document.getElementById('btnComprar').addEventListener('click', async () => {
    if (carrito.length === 0) return;

    // En GitHub Pages no hay backend disponible
    if (EN_GITHUB_PAGES) {
        document.getElementById('toastMsg').textContent =
            '⚠️ Demo visual — el backend debe ejecutarse localmente con npm run dev';
        const toast = new bootstrap.Toast(document.getElementById('toastConfirm'));
        toast.show();
        return;
    }

    try {
        const payload = {
            carrito: carrito.map(i => ({ id: i.id, cantidad: i.cantidad }))
        };

        const res = await fetch('/venta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            carrito = [];
            actualizarBadge();
            bootstrap.Modal.getInstance(document.getElementById('modalCarrito')).hide();

            document.getElementById('toastMsg').textContent =
                `¡Compra exitosa! Total: ${formatPrecio(data.total)}`;
            const toast = new bootstrap.Toast(document.getElementById('toastConfirm'));
            toast.show();

            await cargarProductos();

        } else {
            alert(data.error || 'Error al procesar la compra');
        }

    } catch (error) {
        console.error('Error en la compra:', error);
        alert('Error de conexión con el servidor');
    }
});

// ── Iniciar app ────────────────────────────────────────────
cargarProductos();