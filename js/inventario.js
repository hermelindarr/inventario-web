/*
 * Inventario: guardado de productos en el navegador (localStorage).
 * Funciona igual en XAMPP (localhost) y en GitHub Pages, porque no
 * necesita servidor.
 */
const Inventario = (function () {
    const CLAVE = "inventario-web.productos";
    const LIMITES = {
        nombreMin: 2,
        nombreMax: 60,
        categoriaMin: 2,
        categoriaMax: 40,
        descripcionMax: 200,
        cantidadMax: 100000
    };

    const EJEMPLO = [
        { id: 1, nombre: "Lápiz", categoria: "Papelería", descripcion: "", cantidad: 120 },
        { id: 2, nombre: "Cuaderno", categoria: "Papelería", descripcion: "", cantidad: 50 },
        { id: 3, nombre: "Borrador", categoria: "Papelería", descripcion: "", cantidad: 35 },
        { id: 4, nombre: "Regla", categoria: "Papelería", descripcion: "", cantidad: 40 }
    ];

    // ---------- Almacenamiento ----------
    function almacenamientoDisponible() {
        try {
            const prueba = "__prueba__";
            localStorage.setItem(prueba, prueba);
            localStorage.removeItem(prueba);
            return true;
        } catch (e) {
            return false;
        }
    }

    function listar() {
        let datos = null;
        try {
            datos = JSON.parse(localStorage.getItem(CLAVE));
        } catch (e) {
            datos = null; // datos dañados: se vuelve a los de ejemplo
        }
        if (!Array.isArray(datos)) {
            datos = EJEMPLO.map(function (p) { return Object.assign({}, p); });
            escribir(datos);
        }
        return datos;
    }

    function escribir(lista) {
        localStorage.setItem(CLAVE, JSON.stringify(lista));
    }

    function obtener(id) {
        return listar().find(function (p) { return p.id === id; }) || null;
    }

    // ---------- Limpieza y validación ----------
    function limpiarTexto(valor) {
        return String(valor || "").replace(/\s+/g, " ").trim();
    }

    // Para comparar nombres sin importar mayúsculas, acentos ni espacios
    function normalizar(texto) {
        return limpiarTexto(texto)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "");
    }

    function validar(datos, idActual) {
        const errores = {};
        const nombre = limpiarTexto(datos.nombre);
        const categoria = limpiarTexto(datos.categoria);
        const descripcion = String(datos.descripcion || "").trim();
        const cantidadTexto = String(datos.cantidad === undefined ? "" : datos.cantidad).trim();

        // Nombre
        if (!nombre) {
            errores.nombre = "Escribe el nombre del producto.";
        } else if (nombre.length < LIMITES.nombreMin) {
            errores.nombre = "El nombre debe tener al menos " + LIMITES.nombreMin + " caracteres.";
        } else if (nombre.length > LIMITES.nombreMax) {
            errores.nombre = "El nombre no puede pasar de " + LIMITES.nombreMax + " caracteres.";
        } else if (!/[a-záéíóúüñ]/i.test(nombre)) {
            errores.nombre = "El nombre debe contener al menos una letra.";
        } else {
            const repetido = listar().some(function (p) {
                return p.id !== idActual && normalizar(p.nombre) === normalizar(nombre);
            });
            if (repetido) {
                errores.nombre = "Ya existe un producto con ese nombre.";
            }
        }

        // Categoría
        if (!categoria) {
            errores.categoria = "Escribe la categoría.";
        } else if (categoria.length < LIMITES.categoriaMin) {
            errores.categoria = "La categoría debe tener al menos " + LIMITES.categoriaMin + " caracteres.";
        } else if (categoria.length > LIMITES.categoriaMax) {
            errores.categoria = "La categoría no puede pasar de " + LIMITES.categoriaMax + " caracteres.";
        } else if (!/[a-záéíóúüñ]/i.test(categoria)) {
            errores.categoria = "La categoría debe contener al menos una letra.";
        }

        // Descripción (opcional)
        if (descripcion.length > LIMITES.descripcionMax) {
            errores.descripcion = "La descripción no puede pasar de " + LIMITES.descripcionMax + " caracteres.";
        }

        // Cantidad
        let cantidad = null;
        if (cantidadTexto === "") {
            errores.cantidad = "Escribe la cantidad en existencia.";
        } else if (!/^\d+$/.test(cantidadTexto)) {
            errores.cantidad = "La cantidad debe ser un número entero, sin signos ni decimales.";
        } else {
            cantidad = parseInt(cantidadTexto, 10);
            if (cantidad > LIMITES.cantidadMax) {
                errores.cantidad = "La cantidad no puede ser mayor a " + LIMITES.cantidadMax.toLocaleString("es-MX") + ".";
            }
        }

        return {
            valido: Object.keys(errores).length === 0,
            errores: errores,
            producto: {
                nombre: nombre,
                categoria: categoria,
                descripcion: descripcion,
                cantidad: cantidad
            }
        };
    }

    // ---------- Operaciones ----------
    function agregar(datos) {
        const r = validar(datos, null);
        if (!r.valido) return r;
        const lista = listar();
        const siguienteId = lista.reduce(function (max, p) { return Math.max(max, p.id); }, 0) + 1;
        const nuevo = Object.assign({ id: siguienteId }, r.producto);
        lista.push(nuevo);
        escribir(lista);
        r.producto = nuevo;
        return r;
    }

    function modificar(id, datos) {
        const lista = listar();
        const i = lista.findIndex(function (p) { return p.id === id; });
        if (i === -1) {
            return { valido: false, errores: { general: "El producto ya no existe; quizá se eliminó." } };
        }
        const r = validar(datos, id);
        if (!r.valido) return r;
        lista[i] = Object.assign({ id: id }, r.producto);
        escribir(lista);
        r.producto = lista[i];
        return r;
    }

    function eliminar(id) {
        const lista = listar();
        const restante = lista.filter(function (p) { return p.id !== id; });
        if (restante.length === lista.length) return false;
        escribir(restante);
        return true;
    }

    // ---------- Exportar a Excel (CSV) ----------
    function celdaCsv(valor) {
        let texto = String(valor === null || valor === undefined ? "" : valor);
        // Evita que Excel interprete el texto como fórmula
        if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
        return '"' + texto.replace(/"/g, '""') + '"';
    }

    function fechaHoy() {
        const hoy = new Date();
        return hoy.getFullYear() + "-" +
            String(hoy.getMonth() + 1).padStart(2, "0") + "-" +
            String(hoy.getDate()).padStart(2, "0");
    }

    // Reporte en Excel (.xlsx). Si la librería no cargó (sin internet), se usa CSV.
    function exportarExcel(lista) {
        if (typeof XLSX === "undefined") {
            exportarCsv(lista);
            return "csv";
        }
        const filas = [["ID", "Producto", "Categoría", "Descripción", "Existencia"]].concat(
            lista.map(function (p) { return [p.id, p.nombre, p.categoria, p.descripcion || "", p.cantidad]; })
        );
        filas.push([]);
        filas.push(["", "", "", "Total de unidades", lista.reduce(function (s, p) { return s + p.cantidad; }, 0)]);
        filas.push(["", "", "", "Fecha del reporte", fechaHoy()]);

        const hoja = XLSX.utils.aoa_to_sheet(filas);
        hoja["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 18 }, { wch: 36 }, { wch: 12 }];
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Inventario");
        XLSX.writeFile(libro, "inventario_" + fechaHoy() + ".xlsx");
        return "xlsx";
    }

    function exportarCsv(lista) {
        const encabezado = ["ID", "Producto", "Categoría", "Descripción", "Existencia"];
        const filas = lista.map(function (p) {
            return [p.id, p.nombre, p.categoria, p.descripcion, p.cantidad].map(celdaCsv).join(",");
        });
        const contenido = "﻿" + [encabezado.map(celdaCsv).join(",")].concat(filas).join("\r\n");
        const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = "inventario_" + fechaHoy() + ".csv";
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 1000);
    }

    // ---------- Mensajes entre páginas ----------
    function guardarAviso(texto) {
        try { sessionStorage.setItem("inventario-web.aviso", texto); } catch (e) { /* sin aviso */ }
    }

    function tomarAviso() {
        try {
            const texto = sessionStorage.getItem("inventario-web.aviso");
            sessionStorage.removeItem("inventario-web.aviso");
            return texto;
        } catch (e) {
            return null;
        }
    }

    return {
        LIMITES: LIMITES,
        almacenamientoDisponible: almacenamientoDisponible,
        listar: listar,
        obtener: obtener,
        validar: validar,
        agregar: agregar,
        modificar: modificar,
        eliminar: eliminar,
        exportarCsv: exportarCsv,
        exportarExcel: exportarExcel,
        normalizar: normalizar,
        guardarAviso: guardarAviso,
        tomarAviso: tomarAviso
    };
})();
