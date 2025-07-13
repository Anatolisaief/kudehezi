const formulario = document.querySelector('.formulario');
const listaAcciones = document.querySelector('.acciones-lista');
const idAccionInput = document.querySelector('#idAccion'); // Input oculto para el ID de la acción
const nombreInput = document.querySelector('#nombre');
const asociacionEntidadInput = document.querySelector('#asociacionEntidad');
const emailInput = document.querySelector('#email');
const telefonoInput = document.querySelector('#telefono');
const fechaInicioInput = document.querySelector('#fechaInicio');
const fechaFinInput = document.querySelector('#fechaFin');
const horariosInput = document.querySelector('#horarios');
const tipoAccionInput = document.querySelector('#tipoAccion');
const responsableAccionCheckboxes = document.querySelectorAll('input[name="responsableAccion"]');
const descripcionInput = document.querySelector('#descripcion');
const webInput = document.querySelector('#web');
const btnEnviar = document.querySelector('#btnEnviar');

// dialog para confirmar eliminación
let AccionAEliminarId = null; // Guardamos aquí el ID de la acción a eliminar
const dialogo = document.getElementById('dialogo-confirmar');
const btnConfirmar = document.getElementById('confirmarEliminar');
const btnCancelar = document.getElementById('cancelarEliminar');


async function obtenerAcciones() {
    try {
        const response = await fetch('/api/acciones');
        if (!response.ok) {
            throw new Error('Error al obtener las acciones');
        }
        const acciones = await response.json();
        console.log(acciones);

        listaAcciones.replaceChildren();//limpiar lista antes de añadir nuevas acciones

        // Añadir cabecera siempre antes de las acciones
        const cabecera = document.createElement('div');
        cabecera.classList.add('accion', 'cabecera');
        ['Nombre', 'Entidad', 'Email', 'Teléfono', 'Fecha Inicio', 'Fecha Fin', 'Editar/Borrar']
            .forEach(texto => {
                const el = document.createElement(texto === 'Nombre' ? 'h3' : 'p');
                el.textContent = texto;
                cabecera.appendChild(el);
            });
        listaAcciones.appendChild(cabecera);

        // Iterar sobre las acciones y crear un div para cada una
        acciones.forEach(accion => {

            const accionDiv = document.createElement('div');
            accionDiv.classList.add('accion');

            //campos principales
            const detalles = document.createElement('div');
            detalles.classList.add('detalles');

            const nombre = document.createElement('h3');
            nombre.textContent = accion.nombre;

            const entidad = document.createElement('p');
            entidad.textContent = accion.asociacionEntidad;

            const email = document.createElement('p');
            email.textContent = accion.email;

            const telefono = document.createElement('p');
            telefono.textContent = accion.telefono;

            const fechaInicio = document.createElement('p');
            fechaInicio.textContent = new Date(accion.fechaInicio).toLocaleDateString();

            const fechaFin = document.createElement('p');
            fechaFin.textContent = new Date(accion.fechaFin).toLocaleDateString();

            // campos ocultos por defecto
            const detallesExtra = document.createElement('div');
            detallesExtra.classList.add('detalles-extra');
            detallesExtra.style.display = 'none';



            const horarios = document.createElement('p');
            horarios.textContent = accion.horarios;

            const tipo = document.createElement('p');
            tipo.textContent = accion.tipoAccion;

            const responsable = document.createElement('p');
            // Si responsableAccion es array, únelos, si no, muestra el string
            const responsables = Array.isArray(accion.responsableAccion)
                ? accion.responsableAccion.join(', ')
                : accion.responsableAccion;
            responsable.textContent = responsables;

            const descripcion = document.createElement('p');
            descripcion.textContent = accion.descripcion;

            const web = document.createElement('a');
            web.href = accion.web;
            web.target = "_blank";
            web.textContent = accion.web;

            // Añadir atributos data-label para las etiquetas
            horarios.setAttribute('data-label', 'Horarios');
            tipo.setAttribute('data-label', 'Tipo');
            responsable.setAttribute('data-label', 'Responsable');
            descripcion.setAttribute('data-label', 'Descripción');
            web.setAttribute('data-label', 'Web');

            // Añadir los secundarios al contenedor oculto
            detallesExtra.appendChild(horarios);
            detallesExtra.appendChild(tipo);
            detallesExtra.appendChild(responsable);
            detallesExtra.appendChild(descripcion);
            detallesExtra.appendChild(web);

            // Crear botón de toggle
            const btnToggle = document.createElement('button');
            btnToggle.classList.add('btn-toggle-detalles');

            // Crear el ícono (flecha hacia abajo inicialmente)
            const iconoToggle = document.createElement('i');
            iconoToggle.classList.add('fas', 'fa-chevron-down');

            // Añadir el ícono al botón
            btnToggle.appendChild(iconoToggle);

            // Evento para mostrar/ocultar detalles
            btnToggle.addEventListener('click', () => {
                const mostrando = detallesExtra.style.display === 'flex';

                if (mostrando) {
                    detallesExtra.style.display = 'none';
                    iconoToggle.classList.remove('fa-chevron-up');
                    iconoToggle.classList.add('fa-chevron-down');
                } else {
                    detallesExtra.style.display = 'flex';
                    iconoToggle.classList.remove('fa-chevron-down');
                    iconoToggle.classList.add('fa-chevron-up');
                }
            });

            const divBotones = document.createElement('div');
            divBotones.classList.add('divBotones');

            // Crear botón de editar
            const btnEditar = document.createElement('button');
            btnEditar.classList.add('btn-editar');
            btnEditar.title = 'Editar'; // tooltip

            const iconoEditar = document.createElement('i');
            iconoEditar.classList.add('fas', 'fa-edit'); // Font Awesome icon classes
            btnEditar.appendChild(iconoEditar);

            btnEditar.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('editando:', accion);
                cargarFormulario(accion)
                body.classList.add('formulario-activo');
                toggleBtn.textContent = '✕ Cerrar';
            });

            // Botón de eliminar
            const btnEliminar = document.createElement('button');
            btnEliminar.classList.add('btn-eliminar');

            const iconoEliminar = document.createElement('i');
            iconoEliminar.classList.add('fas', 'fa-trash-alt');
            btnEliminar.appendChild(iconoEliminar);

            btnEliminar.addEventListener('click', (e) => {
                e.preventDefault();

                AccionAEliminarId = accion._id; // Guardamos el ID de la acción a eliminar

                dialogo.showModal();// Abre el diálogo de confirmación


            });

            // Añadir todos los elementos al div principal
            detalles.appendChild(nombre);
            detalles.appendChild(entidad);
            detalles.appendChild(email);
            detalles.appendChild(telefono);
            detalles.appendChild(fechaInicio);
            detalles.appendChild(fechaFin);

            // Añadir botones de acción
            divBotones.appendChild(btnToggle);
            divBotones.appendChild(btnEditar);
            divBotones.appendChild(btnEliminar);
            detalles.appendChild(divBotones);
            
            accionDiv.appendChild(detalles);
            accionDiv.appendChild(detallesExtra);
            listaAcciones.appendChild(accionDiv);
        });
    } catch (error) {
        console.error('Error al obtener las acciones:', error);
    }
}

//Evento que espera que cargue todo el html
document.addEventListener("DOMContentLoaded", () => {
    obtenerAcciones();
});


// Botón para mostrar/ocultar el formulario
const toggleBtn = document.getElementById('toggle-formulario');
const body = document.body;

toggleBtn.addEventListener('click', () => {
    const abriendo = !body.classList.contains('formulario-activo');// Verifica si se está abriendo o cerrando el formulario

    body.classList.toggle('formulario-activo');// Alterna la clase para mostrar/ocultar el formulario


    if (abriendo) {
        limpiarFormulario(); // Limpiar solo si estás abriendo
        toggleBtn.textContent = '✕ Cerrar';
    } else {
        toggleBtn.textContent = '+ Agregar acción';
    }// Cambia el texto del botón según el estado
});


// Función para cargar los datos de una acción en el formulario
function cargarFormulario(accion) {

    formulario.action = `/api/acciones/${accion._id}`;
    formulario.method = 'POST'; // HTML no soporta PUT directamente

    let inputMethod = formulario.querySelector('input[name="_method"]');
    if (!inputMethod) {
        inputMethod = document.createElement('input');
        inputMethod.type = 'hidden';
        inputMethod.name = '_method';
        formulario.appendChild(inputMethod);
    }
    inputMethod.value = 'PUT';// Método para indicar que es una actualización

    // Cargar los datos de la acción en el formulario
    idAccionInput.value = accion._id;
    nombreInput.value = accion.nombre || '';
    asociacionEntidadInput.value = accion.asociacionEntidad || '';
    emailInput.value = accion.email || '';
    telefonoInput.value = accion.telefono || '';
    fechaInicioInput.value = accion.fechaInicio ? new Date(accion.fechaInicio).toISOString().split('T')[0] : '';
    fechaFinInput.value = accion.fechaFin ? new Date(accion.fechaFin).toISOString().split('T')[0] : '';
    horariosInput.value = accion.horarios || '';
    tipoAccionInput.value = accion.tipoAccion || '';
    descripcionInput.value = accion.descripcion || '';
    webInput.value = accion.web || '';

    // Desmarcar todos los checkboxes responsables
    responsableAccionCheckboxes.forEach(chk => chk.checked = false);

    // Marcar los que correspondan
    if (Array.isArray(accion.responsableAccion)) {
        accion.responsableAccion.forEach(responsable => {
            const checkbox = Array.from(responsableAccionCheckboxes).find(chk => chk.value === responsable);
            if (checkbox) checkbox.checked = true;
        });
    } else if (typeof accion.responsableAccion === 'string') {
        const checkbox = Array.from(responsableAccionCheckboxes).find(chk => chk.value === accion.responsableAccion);
        if (checkbox) checkbox.checked = true;
    }

    // Cambiar el texto del botón de enviar
    btnEnviar.textContent = 'Guardar cambios';
}

// Función para limpiar el formulario
function limpiarFormulario() {
    formulario.reset(); // Limpia todos los inputs

    // Desmarcar todos los checkboxes (por si acaso .reset no los limpia)
    responsableAccionCheckboxes.forEach(chk => chk.checked = false);

    // Restablecer atributos del formulario para modo "crear"
    formulario.action = '/api/acciones';
    formulario.method = 'POST';

    // Eliminar el campo _method si existe (de la edición)
    const methodInput = formulario.querySelector('input[name="_method"]');
    if (methodInput) methodInput.remove();

    // También limpiar el campo oculto de ID si lo usas
    idAccionInput.value = '';

    // Restaurar texto del botón de envío
    btnEnviar.textContent = '+ Agregar acción';
}

async function eliminarAccion(_id) {
    try {

        // Desactiva botones para prevenir doble clic
        btnConfirmar.disabled = true;
        btnCancelar.disabled = true;

        // Realiza la petición DELETE al servidor
        const response = await fetch(`/api/acciones/${_id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar la acción');
        }

        const data = await response.json();
        console.log(data);

        if (data.success) {
            obtenerAcciones(); // Refrescar la lista de acciones
        } else {
            console.error('Error al eliminar la acción:', data.message);
        }
    } catch (error) {
        console.error('Error al eliminar la acción:', error);
    } finally {
        dialogo.close();
        AccionAEliminarId = null;
        btnConfirmar.disabled = false;
        btnCancelar.disabled = false;
    }

}

btnConfirmar.addEventListener('click', (e) => {
    e.preventDefault(); // Evita el envío del formulario

    if (AccionAEliminarId) {
        eliminarAccion(AccionAEliminarId); // Llama a la función de eliminación
        AccionAEliminarId = null; // Resetea el ID después de eliminar
    }
});

btnCancelar.addEventListener('click', (e) => {
    e.preventDefault(); // Evita el envío del formulario
    dialogo.close(); // Cierra el diálogo de confirmación
    AccionAEliminarId = null; // Resetea el ID para evitar eliminar accidentalmente
});
