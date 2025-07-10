const formulario = document.querySelector('.formulario');
const listaAcciones = document.querySelector('.acciones-lista');
const nombreInput = document.querySelector('#nombre');
const asociacionEntidadInput = document.querySelector('#asociacionEntidad');
const emailInput = document.querySelector('#email');
const telefonoInput = document.querySelector('#telefono');
const fechaInicioInput = document.querySelector('#fechaInicio');
const fechaFinInput = document.querySelector('#fechaFin');
const horariosInput = document.querySelector('#horarios');
const tipoAccionInput = document.querySelector('#tipoAccion');
const responsableAccionInput = document.querySelector('#responsableAccion');
/* const descripcionInput = document.querySelector('#descripcion');
const webInput = document.querySelector('#web'); */
const btnEnviar = document.querySelector('#btnEnviar');


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
        ['Nombre', 'Entidad', 'Email', 'Teléfono', 'Fecha Inicio', 'Fecha Fin', 'Horarios', 'Tipo', 'Responsable','Editar/Borrar']
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

           /*  const descripcion = document.createElement('p');
            descripcion.textContent = accion.descripcion; */

           /*   const web = document.createElement('a');
            web.href = accion.web;
            web.target = "_blank";
            web.textContent = accion.web; */

            const divBotones = document.createElement('div');
            divBotones.classList.add('divBotones'); 

            // Crear botón de editar
            const btnEditar = document.createElement('button');
            btnEditar.classList.add('btn-editar');
            btnEditar.title = 'Editar'; // tooltip

            const iconoEditar = document.createElement('i');
            iconoEditar.classList.add('fas', 'fa-edit'); // Font Awesome icon classes
            btnEditar.appendChild(iconoEditar);

            btnEditar.addEventListener('click', () => {
                // Aquí puedes cargar los datos en el formulario y activar el modo edición
                // Por ejemplo:
                formulario.nombre.value = accion.nombre;
                // etc...
                body.classList.add('formulario-activo');
                toggleBtn.textContent = '✕ Cerrar';
            });

            // Botón de eliminar
            const btnEliminar = document.createElement('button');
            btnEliminar.classList.add('btn-eliminar');

            const iconoEliminar = document.createElement('i');
            iconoEliminar.classList.add('fas', 'fa-trash-alt');
            btnEliminar.appendChild(iconoEliminar);

            btnEliminar.addEventListener('click', async () => {
                if (confirm('¿Estás seguro de que quieres eliminar esta acción?')) {
                    try {
                        const response = await fetch(`/api/acciones/${accion._id}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            obtenerAcciones(); // Recargar la lista
                        } else {
                            alert('Error al eliminar');
                        }
                    } catch (err) {
                        console.error('Error al eliminar:', err);
                    }
                }
            });

            // Añadir todos los elementos al div principal
            accionDiv.appendChild(nombre);
            accionDiv.appendChild(entidad);
            accionDiv.appendChild(email);
            accionDiv.appendChild(telefono);
            accionDiv.appendChild(fechaInicio);
            accionDiv.appendChild(fechaFin);
            accionDiv.appendChild(horarios);
            accionDiv.appendChild(tipo);
            accionDiv.appendChild(responsable);
        /*     accionDiv.appendChild(descripcion);
            accionDiv.appendChild(web); */
            accionDiv.appendChild(divBotones);
            // Añadir botones de acción
            divBotones.appendChild(btnEditar);
            divBotones.appendChild(btnEliminar);
            accionDiv.appendChild(divBotones);

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

// botón para mostrar/ocultar el formulario
const toggleBtn = document.getElementById('toggle-formulario');
const body = document.body;

toggleBtn.addEventListener('click', () => {
    body.classList.toggle('formulario-activo');

    if (body.classList.contains('formulario-activo')) {
        toggleBtn.textContent = '✕ Cerrar';
    } else {
        toggleBtn.textContent = '+ Agregar acción';
    }
});

