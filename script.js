// --- VARIABLES GLOBALES ---
let indiceActual = null;

// --- 1. LÓGICA DE REQUISITOS DINÁMICOS ---
function actualizarRequisitos() {
    const tipo = document.getElementById('tipoTramite').value;
    const l1 = document.getElementById('labelReq1');
    const l2 = document.getElementById('labelReq2');
    const l3 = document.getElementById('labelReq3');

    if (tipo === "Certificado de Beca") {
        l1.textContent = "Plano de Ubicación";
        l2.textContent = "Cédula de Identidad";
        l3.textContent = "Fotografía de la Fachada";
    } else if (tipo === "Certificado de Estudios") {
        l1.textContent = "Folio Real Actualizado";
        l2.textContent = "Cédula de Identidad";
        l3.textContent = "Factura de Luz o Agua";
    } else if (tipo === "Legalización") {
        l1.textContent = "Título de Propiedad";
        l2.textContent = "Plan de Retiro";
        l3.textContent = "Boleta de Depósito";
    }
}

// --- 2. MODALES (ABRIR Y CERRAR) ---
function cerrar(id) { 
    document.getElementById(id).style.display = 'none'; 
}

document.getElementById('btnConsultar').onclick = () => document.getElementById('modalConsulta').style.display = 'block';

document.getElementById('btnOpenLogin').onclick = () => {
    document.getElementById('loginEmail').value = "";
    document.getElementById('loginPass').value = "";
    document.getElementById('modalLogin').style.display = 'block';
};

document.getElementById('btnIniciar').onclick = () => {
    document.getElementById('modalTramite').style.display = 'block';
    document.getElementById('idAutomatico').value = "ALC-" + Date.now().toString().slice(-6);
    actualizarRequisitos();
};

// --- 3. REGISTRO DE TRÁMITE (CON VALIDACIÓN DE ARCHIVOS) ---
async function registrarTramite() {
    const id = document.getElementById('idAutomatico').value;
    const nombre = document.getElementById('nomSol').value.trim();
    const apellido = document.getElementById('apeSol').value.trim();
    const tipo = document.getElementById('tipoTramite').value;
    const MAX_SIZE = 3 * 1024 * 1024; // 3MB

    if (!nombre || !apellido) {
        return Swal.fire('Atención', 'Nombre y Apellido son obligatorios', 'warning');
    }

    // Procesar archivos
    let archivosData = [];
    for (let i = 1; i <= 3; i++) {
        const input = document.getElementById('file' + i);
        if (input.files.length === 0) {
            return Swal.fire('Falta Archivo', `Debe subir el requisito ${i}`, 'error');
        }
        if (input.files[0].size > MAX_SIZE) {
            return Swal.fire('Error', 'Un archivo supera los 3MB permitidos', 'error');
        }

        const data = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(input.files[0]);
        });

        archivosData.push({
            nombre: input.files[0].name,
            contenido: data,
            tipoEtiqueta: document.getElementById('labelReq' + i).textContent
        });
    }

    // Guardar en LocalStorage (Simulando persistencia que luego documentarás como SQL)
    const nuevoTramite = {
        id, nombre, apellido, tipo,
        estado: "espera",
        fecha: new Date().toLocaleString(),
        archivos: archivosData
    };

    let db = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    db.push(nuevoTramite);
    localStorage.setItem('tramitesAlcaldia', JSON.stringify(db));

    Swal.fire('¡Éxito!', `Trámite registrado. ID: ${id}`, 'success');
    cerrar('modalTramite');
}

// --- 4. PANEL ADMINISTRATIVO ---
function validarAcceso() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    // Validación local para el prototipo
    if (email === "admin@alcaldia.gob" && pass === "123") {
        cerrar('modalLogin');
        document.getElementById('mainView').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        cargarPanelAdmin();
    } else {
        Swal.fire('Error', 'Credenciales inválidas', 'error');
    }
}

function cargarPanelAdmin() {
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    renderizarTabla(db);
}

function renderizarTabla(datos) {
    const lista = document.getElementById('listaTramitesAdmin');
    lista.innerHTML = "";
    if (datos.length === 0) {
        lista.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay trámites.</td></tr>`;
        return;
    }
    datos.forEach((t, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${t.fecha}</td>
            <td>${t.nombre} ${t.apellido}</td>
            <td>${t.tipo}</td>
            <td><span class="status-${t.estado}">${t.estado.toUpperCase()}</span></td>
            <td>
                <button class="btn-acc btn-check" onclick="cambiarEstado(${index}, 'aceptado')">✓</button>
                <button class="btn-acc btn-x" onclick="cambiarEstado(${index}, 'rechazado')">✕</button>
                <button class="btn-acc btn-doc" style="background:#f39c12;" onclick="verArchivosUsuario(${index})">📂 Ver</button>
                <button class="btn-acc btn-doc" onclick="abrirMandarDoc(${index})">✉ Enviar</button>
            </td>
        `;
        lista.appendChild(fila);
    });
}

function cambiarEstado(index, nuevo) {
    let db = JSON.parse(localStorage.getItem('tramitesAlcaldia'));
    db[index].estado = nuevo;
    localStorage.setItem('tramitesAlcaldia', JSON.stringify(db));
    cargarPanelAdmin();
}

// --- 5. GESTIÓN DE ARCHIVOS (ADMIN) ---
function verArchivosUsuario(index) {
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia'));
    const t = db[index];
    const contenedor = document.getElementById('contenedorFotos');
    contenedor.innerHTML = "";
    t.archivos.forEach(file => {
        const div = document.createElement('div');
        div.style = "margin-bottom:20px; padding:10px; border-bottom:1px solid #ddd;";
        div.innerHTML = `<p><b>${file.tipoEtiqueta}:</b> ${file.nombre}</p>`;
        if (file.contenido.includes("image")) {
            div.innerHTML += `<img src="${file.contenido}" style="width:100%;">`;
        } else {
            div.innerHTML += `<a href="${file.contenido}" download="${file.nombre}">📄 Descargar PDF</a>`;
        }
        contenedor.appendChild(div);
    });
    document.getElementById('modalVerFotos').style.display = 'block';
}

function abrirMandarDoc(index) {
    indiceActual = index;
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia'));
    document.getElementById('infoDestino').textContent = "Enviar a: " + db[index].nombre + " " + db[index].apellido;
    document.getElementById('modalMandarDoc').style.display = 'block';
}

async function confirmarEnvio() {
    const fileInput = document.getElementById('fileRespuesta');
    if (fileInput.files.length === 0) return Swal.fire('Error', 'Selecciona un archivo', 'error');

    const reader = new FileReader();
    reader.onload = function(e) {
        let db = JSON.parse(localStorage.getItem('tramitesAlcaldia'));
        db[indiceActual].respuestaOficial = {
            nombre: fileInput.files[0].name,
            contenido: e.target.result
        };
        db[indiceActual].estado = "aceptado";
        localStorage.setItem('tramitesAlcaldia', JSON.stringify(db));
        Swal.fire('Enviado', 'Documento oficial cargado', 'success');
        cerrar('modalMandarDoc');
        cargarPanelAdmin();
    };
    reader.readAsDataURL(fileInput.files[0]);
}

// --- 6. CONSULTA (USUARIO) ---
function buscarTramite() {
    const idBusca = document.getElementById('idBusqueda').value.trim();
    const apeBusca = document.getElementById('apellidoBusqueda').value.trim().toLowerCase();
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    const t = db.find(item => item.id === idBusca && item.apellido.toLowerCase() === apeBusca);
    const res = document.getElementById('resultadoBusqueda');

    if (t) {
        res.innerHTML = `
            <div style="background:white; padding:15px; border:2px solid #1d3557; border-radius:10px; color:#1d3557; margin-top:10px;">
                <p><strong>Estado:</strong> <span class="status-${t.estado}">${t.estado.toUpperCase()}</span></p>
                <p><strong>Solicitante:</strong> ${t.nombre} ${t.apellido}</p>
                ${t.respuestaOficial ? 
                    `<a href="${t.respuestaOficial.contenido}" download="Respuesta_${t.id}" style="display:block; background:#27ae60; color:white; text-align:center; padding:10px; border-radius:5px; text-decoration:none; margin-top:10px;">📥 DESCARGAR DOCUMENTO OFICIAL</a>` 
                    : '<p style="color:gray;">Respuesta en proceso...</p>'}
            </div>`;
    } else {
        Swal.fire('No encontrado', 'ID o Apellido incorrectos', 'error');
    }
}

// EXTRAS
function filtrarPorNombre() {
    const texto = document.getElementById('buscadorAdmin').value.toLowerCase();
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    const filtrados = db.filter(t => (t.nombre + " " + t.apellido).toLowerCase().includes(texto));
    renderizarTabla(filtrados);
}

function descargarExcel() {
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    let csv = "\ufeffID,Fecha,Solicitante,Trámite,Estado\n";
    db.forEach(t => { csv += `${t.id},${t.fecha},${t.nombre} ${t.apellido},${t.tipo},${t.estado}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reporte.csv";
    link.click();
}

function borrarTodoReal() {
    Swal.fire({
        title: '¿Borrar todo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, borrar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('tramitesAlcaldia');
            cargarPanelAdmin();
        }
    });
}