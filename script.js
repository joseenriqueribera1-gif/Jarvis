const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const status = document.getElementById("status");
const memoryList = document.getElementById("memoryList");
const clearMemory = document.getElementById("clearMemory");

let memories = JSON.parse(localStorage.getItem("jozJarvisMemory") || "[]");

function addMessage(who, text) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.innerHTML = `<b>${who === "jarvis" ? "JARVIS" : "JOZ"}:</b> ${escapeHtml(text)}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-ES";
  u.rate = 1;
  speechSynthesis.speak(u);
}

function renderMemory() {
  if (!memories.length) {
    memoryList.textContent = "Sin recuerdos guardados.";
    return;
  }
  memoryList.innerHTML = memories.map((m, i) =>
    `<div class="memory-item"><b>${i + 1}.</b> ${escapeHtml(m)}</div>`
  ).join("");
}

function saveMemory(text) {
  memories.push(text);
  localStorage.setItem("jozJarvisMemory", JSON.stringify(memories));
  renderMemory();
}

function responseFor(raw) {
  const t = raw.toLowerCase().trim();

  if (t.includes("qué hora") || t.includes("que hora")) {
    return `Son las ${new Date().toLocaleTimeString("es-BO", {
      hour: "2-digit", minute: "2-digit"
    })}.`;
  }

  if (t.includes("qué fecha") || t.includes("que fecha") || t.includes("qué día") || t.includes("que dia")) {
    return `Hoy es ${new Date().toLocaleDateString("es-BO", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    })}.`;
  }

  if (t.startsWith("recuerda que ")) {
    const memory = raw.slice(raw.toLowerCase().indexOf("recuerda que ") + 12).trim();
    if (!memory) return "Necesito saber qué quieres que recuerde.";
    saveMemory(memory);
    return `Entendido, Joz. Lo guardaré en mi memoria local: "${memory}".`;
  }

  if (t.includes("qué recuerdas") || t.includes("que recuerdas") || t.includes("mis recuerdos")) {
    if (!memories.length) return "Por ahora no tengo recuerdos guardados.";
    return "Tengo estos recuerdos: " + memories.map((m, i) => `${i + 1}) ${m}`).join(" | ");
  }

  if (t === "hola" || t.includes("hola jarvis")) {
    return "A sus órdenes, Joz. ¿Qué misión tenemos?";
  }

  if (t.includes("quién eres") || t.includes("quien eres")) {
    return "Soy JARVIS, tu prototipo de asistente personal. Esta versión funciona localmente en tu navegador.";
  }

  if (t.includes("gracias")) {
    return "Siempre a sus órdenes, Joz.";
  }

  return "He recibido la orden. Mi cerebro avanzado todavía no está conectado en esta versión, pero el sistema base funciona correctamente.";
}

function run() {
  const text = input.value.trim();
  if (!text) return;
  addMessage("joz", text);
  input.value = "";

  const answer = responseFor(text);
  setTimeout(() => {
    addMessage("jarvis", answer);
    speak(answer);
  }, 250);
}

send.addEventListener("click", run);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") run();
});

clearMemory.addEventListener("click", () => {
  memories = [];
  localStorage.removeItem("jozJarvisMemory");
  renderMemory();
  addMessage("jarvis", "Memoria local borrada.");
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "es-BO";
  recognition.interimResults = false;
  recognition.continuous = false;

  mic.addEventListener("click", () => {
    status.textContent = "● ESCUCHANDO...";
    recognition.start();
  });

  recognition.onresult = e => {
    input.value = e.results[0][0].transcript;
    status.textContent = "● ORDEN RECIBIDA";
    run();
  };

  recognition.onerror = () => {
    status.textContent = "● ERROR DE MICRÓFONO";
  };

  recognition.onend = () => {
    if (status.textContent.includes("ESCUCHANDO")) status.textContent = "● EN ESPERA";
  };
} else {
  mic.disabled = true;
  mic.title = "Reconocimiento de voz no disponible en este navegador";
}

renderMemory();
