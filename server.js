// ── Importaciones ──────────────────────────────────────────
const express = require('express');
const path = require('path');
const { promises: fs } = require('fs');
const { v4: uuidv4 } = require('uuid');

// ── Rutas a los archivos de datos ──────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const FILE_PROD = path.join(DATA_DIR, 'productos.json');
const FILE_VENT = path.join(DATA_DIR, 'ventas.json');

// ── Inicializar Express ────────────────────────────────────
const app = express();
app.use(express.json());                                      // leer body JSON
app.use(express.static(path.join(__dirname, 'docs')));     // servir frontend

// ── Helpers de File System ─────────────────────────────────
const leerJson = async (file) => JSON.parse(await fs.readFile(file, 'utf-8'));
const escribirJson = async (file, data) =>
    fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');

// ── Inicializar archivos si no existen ─────────────────────
const inicializarArchivos = async () => {
    try {
        await fs.access(FILE_PROD);
    } catch {
        await escribirJson(FILE_PROD, []);
        console.log('📄 productos.json creado');
    }
    try {
        await fs.access(FILE_VENT);
    } catch {
        await escribirJson(FILE_VENT, []);
        console.log('📄 ventas.json creado');
    }
};

inicializarArchivos();

// ── GET /productos ─────────────────────────────────────────
app.get('/productos', async (req, res) => {
    try {
        const productos = await leerJson(FILE_PROD);
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer productos' });
    }
});

// ── POST /producto ─────────────────────────────────────────
app.post('/producto', async (req, res) => {
    try {
        const { nombre, precio, stock } = req.body;

        // Validación: los tres campos son obligatorios
        if (!nombre || precio == null || stock == null)
            return res.status(400).json({ error: 'Faltan datos: nombre, precio y stock son obligatorios' });

        const productos = await leerJson(FILE_PROD);

        const nuevo = { id: uuidv4(), nombre, precio, stock };
        productos.push(nuevo);

        await escribirJson(FILE_PROD, productos);
        res.status(201).json(nuevo);

    } catch (error) {
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// ── DELETE /producto ───────────────────────────────────────
app.delete('/producto', async (req, res) => {
    try {
        const { id } = req.body;

        if (!id)
            return res.status(400).json({ error: 'El id es obligatorio' });

        const productos = await leerJson(FILE_PROD);
        const index = productos.findIndex(p => p.id === id);

        if (index === -1)
            return res.status(404).json({ error: 'Producto no encontrado' });

        const eliminado = productos.splice(index, 1);

        await escribirJson(FILE_PROD, productos);
        res.status(200).json({ mensaje: 'Producto eliminado', producto: eliminado[0] });

    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// ── PUT /producto ──────────────────────────────────────────
app.put('/producto', async (req, res) => {
    try {
        const { id, nombre, precio, stock } = req.body;

        if (!id)
            return res.status(400).json({ error: 'El id es obligatorio' });

        const productos = await leerJson(FILE_PROD);
        const index = productos.findIndex(p => p.id === id);

        if (index === -1)
            return res.status(404).json({ error: 'Producto no encontrado' });

        if (nombre != null) productos[index].nombre = nombre;
        if (precio != null) productos[index].precio = precio;
        if (stock != null) productos[index].stock = stock;

        await escribirJson(FILE_PROD, productos);
        res.status(200).json(productos[index]);

    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// ── GET /ventas ────────────────────────────────────────────
app.get('/ventas', async (req, res) => {
    try {
        const ventas = await leerJson(FILE_VENT);
        res.status(200).json(ventas);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer ventas' });
    }
});

// ── POST /venta ────────────────────────────────────────────
app.post('/venta', async (req, res) => {
    try {
        const { carrito } = req.body;

        // 1. Validar que llegó un carrito con productos
        if (!carrito || carrito.length === 0)
            return res.status(400).json({ error: 'El carrito está vacío' });

        const productos = await leerJson(FILE_PROD);

        // 2. Verificar stock de cada producto del carrito
        for (const item of carrito) {
            const producto = productos.find(p => p.id === item.id);

            if (!producto)
                return res.status(404).json({ error: `Producto ${item.id} no encontrado` });

            if (producto.stock < item.cantidad)
                return res.status(409).json({ error: `Stock insuficiente para ${producto.nombre}` });
        }

        // 3. Descontar stock y calcular monto total
        let total = 0;
        for (const item of carrito) {
            const producto = productos.find(p => p.id === item.id);
            producto.stock -= item.cantidad;
            total += producto.precio * item.cantidad;
        }

        // 4. Registrar la venta
        const ventas = await leerJson(FILE_VENT);
        const nuevaVenta = {
            id: uuidv4(),
            fecha: new Date().toISOString(),
            carrito,
            total
        };
        ventas.push(nuevaVenta);

        // 5. Guardar ambos archivos
        await escribirJson(FILE_PROD, productos);
        await escribirJson(FILE_VENT, ventas);

        res.status(201).json(nuevaVenta);

    } catch (error) {
        res.status(500).json({ error: 'Error al registrar venta' });
    }
});
// ── Arrancar servidor ──────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API corriendo en http://localhost:${PORT}`));