/* ============ CONFIGURACIÓN ============ */
// Pega aquí la URL de tu aplicación web de Apps Script (termina en /exec)
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbwIxKR7s5C27lgwd9RrZOSyPAYgpcDw53bNqjzDXnjS8bb5NpcvUVq3kEAJWLvW92Bv4g/exec";
 
const OPCIONES = [
  "Humildad - Soberbia",
  "Diligencia - Pereza",
  "Pureza - Lujuria",
  "Generosidad/Austeridad - Avaricia",
  "Templanza - Gula",
  "Paciencia/Comprensión - Ira",
  "Caridad/Agradecimiento - Envidia",
  "Piedad - Tibieza",
  "Mansedumbre - Rebeldía",
  "Por todas en general"
];
 
// tipo: "numero" o "texto"
const CAMPOS = [
  { id: "misas",         tipo: "numero", etiqueta: "Misas ofrecidas" },
  { id: "horas",         tipo: "numero", etiqueta: "Horas de estudio/trabajo" },
  { id: "misterios",     tipo: "numero", etiqueta: "Misterios", ayuda: "Si has ofrecido un rosario, pon 5 misterios" },
  { id: "horasSantas",   tipo: "numero", etiqueta: "Horas Santas" },
  { id: "sacGrande",     tipo: "texto",  etiqueta: "Sacrificio grandote" },
  { id: "sacPequeno",    tipo: "texto",  etiqueta: "Sacrificio pequeñín", ayuda: "No por ello menos valioso" },
  { id: "otrosActos",    tipo: "texto",  etiqueta: "Otros actos", ayuda: "No hace falta que pongas el acto concreto" }
];
const ID_OTRO = "otro";
/* ======================================= */
 
const lista = document.getElementById("lista-opciones");
const contenedor = document.getElementById("cuestionarios");
const cuestionarios = {}; // clave -> {tarjeta, titulo, inputs}
 
function crearCuestionario(clave, tituloInicial) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta seccion";
  tarjeta.hidden = true;
 
  const titulo = document.createElement("h2");
  titulo.textContent = tituloInicial;
  tarjeta.appendChild(titulo);
 
  const inputs = {};
  CAMPOS.forEach(c => {
    const campo = document.createElement("div");
    campo.className = "campo";
    const label = document.createElement("label");
    const idInput = `${clave}-${c.id}`;
    label.htmlFor = idInput;
    label.textContent = c.etiqueta;
    campo.appendChild(label);
    if (c.ayuda) {
      const ayuda = document.createElement("span");
      ayuda.className = "ayuda";
      ayuda.textContent = c.ayuda;
      campo.appendChild(ayuda);
    }
    let input;
    if (c.tipo === "numero") {
      input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = "any";
      input.inputMode = "decimal";
    } else {
      input = document.createElement("textarea");
      input.rows = 1;
      input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = input.scrollHeight + "px";
      });
    }
    input.id = idInput;
    input.placeholder = "Tu respuesta";
    input.disabled = true;
    campo.appendChild(input);
    const err = document.createElement("div");
    err.className = "error-msg";
    err.textContent = "Introduce un número válido (0 o más)";
    campo.appendChild(err);
    tarjeta.appendChild(campo);
    inputs[c.id] = input;
  });
 
  const errT = document.createElement("div");
  errT.className = "error-msg";
  errT.style.marginTop = "20px";
  errT.textContent = "Responde al menos una pregunta de este cuestionario";
  tarjeta.appendChild(errT);
 
  contenedor.appendChild(tarjeta);
  cuestionarios[clave] = { tarjeta, titulo, inputs, errT };
}
 
function crearOpcion(clave, texto) {
  const label = document.createElement("label");
  label.className = "opcion";
  label.innerHTML = `<input type="checkbox" value="${clave}"><span class="caja"></span><span></span>`;
  label.lastChild.textContent = texto;
  lista.appendChild(label);
  return label.querySelector("input");
}
 
function mostrar(clave, visible) {
  const q = cuestionarios[clave];
  q.tarjeta.hidden = !visible;
  Object.values(q.inputs).forEach(i => i.disabled = !visible);
}
 
/* Opciones del desplegable original */
OPCIONES.forEach((texto, i) => {
  const clave = "op" + i;
  crearCuestionario(clave, texto);
  crearOpcion(clave, texto).addEventListener("change", e => mostrar(clave, e.target.checked));
});
 
/* Opción "Otro" con texto libre */
crearCuestionario(ID_OTRO, "Otro");
const chkOtro = crearOpcion(ID_OTRO, "Otro:");
const otroTexto = document.createElement("input");
otroTexto.type = "text";
otroTexto.id = "otro-texto";
otroTexto.placeholder = "Escribe aquí";
otroTexto.hidden = true;
lista.appendChild(otroTexto);
 
chkOtro.addEventListener("change", e => {
  otroTexto.hidden = !e.target.checked;
  otroTexto.required = e.target.checked;
  mostrar(ID_OTRO, e.target.checked);
  if (e.target.checked) otroTexto.focus();
});
otroTexto.addEventListener("input", () => {
  cuestionarios[ID_OTRO].titulo.textContent = otroTexto.value.trim() || "Otro";
});
 
/* Validación y envío */
const form = document.getElementById("formulario");
const estado = document.getElementById("estado");
const btn = document.getElementById("enviar");
 
function marcarError(elemento, hayError) {
  const tarjeta = elemento.closest(".tarjeta");
  tarjeta.classList.toggle("con-error", hayError);
}
 
form.addEventListener("submit", async e => {
  e.preventDefault();
  estado.textContent = "";
  let primerError = null;
 
  const marcadas = [...lista.querySelectorAll("input[type=checkbox]:checked")].map(c => c.value);
  const sinOpciones = marcadas.length === 0;
  document.getElementById("tarjeta-opciones").classList.toggle("con-error", sinOpciones);
  if (sinOpciones) primerError = primerError || lista;
 
  const respuestas = [];
  marcadas.forEach(clave => {
    const q = cuestionarios[clave];
    let tituloFinal = q.titulo.textContent;
    if (clave === ID_OTRO) {
      const t = otroTexto.value.trim();
      if (!t) { marcarError(otroTexto, true); primerError = primerError || otroTexto; }
      else marcarError(otroTexto, false);
      tituloFinal = "Otro: " + t;
    }
    const fila = { virtud: tituloFinal };
    let tarjetaMal = false;
    let algunaRespondida = false;
    CAMPOS.forEach(c => {
      const input = q.inputs[c.id];
      const valor = input.value.trim();
      const mal = valor !== "" && c.tipo === "numero" && (isNaN(Number(valor)) || Number(valor) < 0);
      input.closest(".campo").querySelector(".error-msg").style.display = mal ? "block" : "none";
      if (mal) { tarjetaMal = true; primerError = primerError || input; }
      if (valor !== "") algunaRespondida = true;
      if (valor === "") fila[c.id] = c.tipo === "numero" ? 0 : "-";
      else fila[c.id] = c.tipo === "numero" ? Number(valor) : valor;
    });
    if (!algunaRespondida) {
      tarjetaMal = true;
      primerError = primerError || q.tarjeta;
    }
    q.errT.style.display = algunaRespondida ? "none" : "block";
    q.tarjeta.classList.toggle("con-error", tarjetaMal);
    respuestas.push(fila);
  });
 
  if (primerError) {
    primerError.scrollIntoView({ behavior: "smooth", block: "center" });
    estado.textContent = "Revisa las preguntas marcadas en rojo.";
    return;
  }
 
  if (URL_APPS_SCRIPT.startsWith("PEGA_AQUI")) {
    estado.textContent = "Falta configurar la URL de Apps Script en el código (variable URL_APPS_SCRIPT).";
    return;
  }
 
  btn.disabled = true;
  btn.textContent = "Enviando...";
  try {
    await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ respuestas })
    });
    form.hidden = true;
    document.getElementById("gracias").hidden = false;
    window.scrollTo({ top: 0 });
  } catch (err) {
    estado.textContent = "No se pudo enviar. Comprueba tu conexión e inténtalo de nuevo.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Enviar";
  }
});
 
document.getElementById("otra").addEventListener("click", () => {
  form.reset();
  Object.keys(cuestionarios).forEach(k => mostrar(k, false));
  otroTexto.hidden = true;
  cuestionarios[ID_OTRO].titulo.textContent = "Otro";
  document.querySelectorAll(".con-error").forEach(t => t.classList.remove("con-error"));
  document.querySelectorAll(".seccion .error-msg").forEach(m => m.style.display = "none");
  document.getElementById("gracias").hidden = true;
  form.hidden = false;
});
