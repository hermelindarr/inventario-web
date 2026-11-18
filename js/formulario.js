/* Formulario para agregar o modificar un producto (agregar.html?id=N) */
(function () {
    const form = document.getElementById("formulario");
    const mensaje = document.getElementById("mensaje");
    const boton = document.getElementById("boton-guardar");
    const campos = ["nombre", "categoria", "descripcion", "cantidad"];

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = "mensaje " + tipo;
        mensaje.hidden = false;
    }

    function limpiarErrores() {
        campos.forEach(function (c) {
            document.getElementById("error-" + c).textContent = "";
            document.getElementById(c).classList.remove("invalido");
        });
    }

    function mostrarErrores(errores) {
        let primero = null;
        campos.forEach(function (c) {
            if (errores[c]) {
                document.getElementById("error-" + c).textContent = errores[c];
                document.getElementById(c).classList.add("invalido");
                if (!primero) primero = document.getElementById(c);
            }
        });
        if (primero) primero.focus();
    }

    // Sin almacenamiento no se puede guardar nada
    if (!Inventario.almacenamientoDisponible()) {
        mostrarMensaje("Tu navegador no permite guardar datos (modo privado o almacenamiento bloqueado).", "error");
        boton.disabled = true;
        return;
    }

    // ¿Modificar? -> agregar.html?id=N
    const idTexto = new URLSearchParams(location.search).get("id");
    let idEditar = null;

    if (idTexto !== null) {
        const id = /^\d+$/.test(idTexto) ? parseInt(idTexto, 10) : NaN;
        const producto = isNaN(id) ? null : Inventario.obtener(id);
        if (!producto) {
            mostrarMensaje("No se encontró el producto que quieres modificar.", "error");
            Array.prototype.forEach.call(form.elements, function (el) { el.disabled = true; });
            return;
        }
        idEditar = id;
        document.title = "Modificar Producto";
        document.getElementById("titulo").textContent = "Modificar Producto";
        boton.textContent = "Guardar Cambios";
        document.getElementById("nombre").value = producto.nombre;
        document.getElementById("categoria").value = producto.categoria;
        document.getElementById("descripcion").value = producto.descripcion || "";
        document.getElementById("cantidad").value = producto.cantidad;
    }

    // Quita el error de un campo en cuanto se corrige
    campos.forEach(function (c) {
        document.getElementById(c).addEventListener("input", function () {
            document.getElementById("error-" + c).textContent = "";
            this.classList.remove("invalido");
        });
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (boton.disabled) return; // evita doble envío
        limpiarErrores();
        mensaje.hidden = true;

        const cantidadInput = document.getElementById("cantidad");
        const datos = {
            nombre: document.getElementById("nombre").value,
            categoria: document.getElementById("categoria").value,
            descripcion: document.getElementById("descripcion").value,
            // si se escribió algo que no es número, el navegador deja value vacío
            cantidad: cantidadInput.validity.badInput ? "x" : cantidadInput.value
        };

        boton.disabled = true;
        let r;
        try {
            r = idEditar === null ? Inventario.agregar(datos) : Inventario.modificar(idEditar, datos);
        } catch (err) {
            boton.disabled = false;
            mostrarMensaje("No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado.", "error");
            return;
        }

        if (!r.valido) {
            boton.disabled = false;
            if (r.errores.general) {
                mostrarMensaje(r.errores.general, "error");
            } else {
                mostrarMensaje("Revisa los campos marcados.", "error");
                mostrarErrores(r.errores);
            }
            return;
        }

        Inventario.guardarAviso(
            idEditar === null
                ? "Producto “" + r.producto.nombre + "” guardado correctamente."
                : "Cambios de “" + r.producto.nombre + "” guardados correctamente."
        );
        location.href = "productos.html";
    });
})();
