/* Tabla de productos: mostrar, modificar, eliminar y exportar */
(function () {
    const cuerpo = document.getElementById("cuerpo-tabla");
    const mensaje = document.getElementById("mensaje");
    const botonExportar = document.getElementById("exportar");

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = "mensaje " + tipo;
        mensaje.hidden = false;
    }

    function celda(texto) {
        const td = document.createElement("td");
        td.textContent = texto;
        return td;
    }

    function dibujar() {
        const lista = Inventario.listar();
        cuerpo.innerHTML = "";

        if (lista.length === 0) {
            const tr = document.createElement("tr");
            const td = celda("No hay productos registrados.");
            td.colSpan = 5;
            td.className = "vacio";
            tr.appendChild(td);
            cuerpo.appendChild(tr);
        }

        lista.forEach(function (p) {
            const tr = document.createElement("tr");
            tr.appendChild(celda(p.id));
            tr.appendChild(celda(p.nombre));
            tr.appendChild(celda(p.categoria));
            tr.appendChild(celda(p.cantidad));

            const acciones = document.createElement("td");

            const editar = document.createElement("a");
            editar.href = "agregar.html?id=" + p.id;
            editar.className = "boton-editar";
            editar.textContent = "Modificar";

            const borrar = document.createElement("button");
            borrar.type = "button";
            borrar.className = "boton-chico boton-eliminar";
            borrar.textContent = "Eliminar";
            borrar.addEventListener("click", function () { eliminar(p.id); });

            acciones.appendChild(editar);
            acciones.appendChild(borrar);
            tr.appendChild(acciones);
            cuerpo.appendChild(tr);
        });

        botonExportar.disabled = lista.length === 0;
    }

    function eliminar(id) {
        const p = Inventario.obtener(id);
        if (!p) {
            mostrarMensaje("Ese producto ya había sido eliminado.", "error");
            dibujar();
            return;
        }
        if (!confirm("¿Eliminar “" + p.nombre + "” del inventario?\nEsta acción no se puede deshacer.")) {
            return;
        }
        try {
            Inventario.eliminar(id);
            mostrarMensaje("Producto “" + p.nombre + "” eliminado.", "exito");
        } catch (e) {
            mostrarMensaje("No se pudo eliminar: el almacenamiento del navegador está bloqueado.", "error");
        }
        dibujar();
    }

    if (!Inventario.almacenamientoDisponible()) {
        mostrarMensaje("Tu navegador no permite guardar datos (modo privado o almacenamiento bloqueado).", "error");
    }

    const aviso = Inventario.tomarAviso();
    if (aviso) mostrarMensaje(aviso, "exito");

    botonExportar.addEventListener("click", function () {
        const lista = Inventario.listar();
        if (lista.length === 0) {
            mostrarMensaje("No hay productos para exportar.", "error");
            return;
        }
        let formato;
        try {
            formato = Inventario.exportarExcel(lista);
        } catch (e) {
            mostrarMensaje("No se pudo generar el reporte.", "error");
            return;
        }
        mostrarMensaje(
            "Se descargó el reporte de Excel con " + lista.length + (lista.length === 1 ? " producto" : " productos") +
            (formato === "csv" ? " (en formato CSV porque no hay conexión a internet)." : "."),
            "exito"
        );
    });

    // Si otra pestaña cambia el inventario, se actualiza la tabla
    window.addEventListener("storage", dibujar);

    dibujar();
})();
