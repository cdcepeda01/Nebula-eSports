import { connect, sendMessage } from "./web/chatSocket.js";
import { clearUser, redirectToLogin } from "./ui/chatUI.js"; // showUserList ya no se usa

// ==================== Verificar usuario ====================
const user = JSON.parse(localStorage.getItem("user"));
if (!user) redirectToLogin();
// ====== Footer dinámico ======
function renderFooterUser(u){
  const nameEl   = document.getElementById("footerName");
  const roleEl   = document.getElementById("footerRole");
  const tagEl    = document.getElementById("footerTag");
  const onlineEl = document.getElementById("footerOnline");
  const avatarEl = document.getElementById("footerAvatar");
  const statusEl = document.getElementById("footerStatus");

  if (!nameEl || !roleEl || !tagEl || !onlineEl || !avatarEl || !statusEl) return;

  // Nombre
  nameEl.textContent = u.name || "Usuario";

  // Rol (admin/user) en mayúsculas
  const rol = (u.rol || u.role || "user").toUpperCase();
  roleEl.textContent = rol;

  // Tag/ID con relleno (ej. #0007)
  const tag = `#${String(u.id ?? "").toString().padStart(4,"0")}`;
  tagEl.textContent = tag;

  // Estado (tú mismo = online mientras la WS esté abierta)
  onlineEl.textContent = "· En línea";

  // Avatar (usa el del JSON o un fallback)
  avatarEl.src = u.img || u.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(u.name || "User");
  avatarEl.alt = u.name || "Usuario";

  // Puntico de estado
  statusEl.classList.remove("offline");
  statusEl.classList.add("online");
}

// Llama aquí, después de leer user y antes/justo después de connect(user):
if (!user) redirectToLogin();
renderFooterUser(user);

// Header con el nombre
const titleHeader = document.getElementById("chat-username");
if (titleHeader) titleHeader.textContent = "Bienvenido " + user.name;

// ==================== Referencias DOM ====================
const chatForm     = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const logoutBtn    = document.getElementById("logoutBtn");
const sidebar      = document.getElementById("userSidebar");
const toggleBtn    = document.getElementById("usersToggle");
const closeBtn     = document.getElementById("closeSidebar");
const channelsbar  = document.querySelector(".channelsbar");
const titleEl      = document.getElementById("chat-username");
const inputEl      = document.getElementById("messageInput");
const messagesEl   = document.getElementById("messages");

// ==================== Conectar WebSocket ====================
connect(user);

// ==================== Eventos básicos ====================
logoutBtn?.addEventListener("click", () => {
  clearUser();
  redirectToLogin();
});

// === Sidebar Miembros: una sola forma de abrir/cerrar ===
toggleBtn?.addEventListener("click", () => {
  sidebar?.classList.toggle("is-visible");
});
closeBtn?.addEventListener("click", () => {
  sidebar?.classList.remove("is-visible");
});
// ——— Helpers para limpiar lo que viene del server ———
function stripChannelTag(t = "") {
  // quita "[algo]" al principio + espacio
  return String(t).replace(/^\[[^\]]+\]\s*/, "");
}

function parseIncoming(raw) {
  // Si ya viene como objeto { authorName, text } o { from, message }
  if (raw && typeof raw === "object") {
    const author = raw.authorName || raw.from || "Sistema";
    const text   = stripChannelTag(raw.text || raw.message || "");
    return { authorName: author, text };
  }

  // Si viene como string "Nombre: [canal] mensaje"
  const s   = String(raw ?? "");
  const idx = s.indexOf(":");
  let authorName = "Sistema";
  let text = s;

  if (idx > -1 && idx < 40) {        // "Nombre:" razonable
    authorName = s.slice(0, idx).trim();
    text       = s.slice(idx + 1).trim();
  }
  return { authorName, text: stripChannelTag(text) };
}

// ==================== Render de mensajes (.msg) ====================
function renderMsg({ authorName, text, isSelf=false, color='#8b5cf6', isReply=false }) {
  if (!messagesEl) return;

  const msg = document.createElement('div');
  msg.className = `msg ${isSelf ? '-self' : '-other'}${isReply ? ' -reply' : ''}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg__avatar';
  avatar.style.setProperty('--av', color);
  avatar.innerHTML = '<i class="fa-regular fa-user"></i>';

  const label = document.createElement('div');
  label.className = 'msg__label';
  label.textContent = authorName;

  const bubble = document.createElement('div');
  bubble.className = 'msg__bubble';
  bubble.textContent = text;

  // 👇 Importa el orden: avatar (col1/2), label (col2/1), bubble (col2/2)
  msg.appendChild(avatar);
  msg.appendChild(label);
  msg.appendChild(bubble);

  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ==================== Canales ====================
let currentChannel = null;

const CHANNEL_MESSAGES = {
  general: ["Bienvenido a #General", "Recuerda las reglas ✨"],
  gaming: ["Hablemos de juegos hoy", "¿Qué estás jugando hoy? 🕹️"],
  ideas: ["Deja tus sugerencias aquí", "💡 Idea #1: ..."],
  leagueoflegends: ["Bienvenido a #LeagueOfLegends", "¿Quién se apunta a un Lolsito? 🎮"],
  valorant: ["Bienvenido a #Valorant", "¿Quién juega hoy Valorant? 🔥"],
  fortnite: ["Bienvenido a #Fortnite", "¿Listos para unas partidas? 🏆"],
  ayuda: ["¿Necesitas ayuda?", "❓ Deja tus preguntas aquí"],
};

function setActiveChannel(id, name) {
  currentChannel = { id, name };

  // 1) activar visualmente el botón
  document.querySelectorAll(".chan.is-active").forEach((b) => b.classList.remove("is-active"));
  const btn = document.querySelector(`.chan[data-channel-id="${id}"]`);
  if (btn) btn.classList.add("is-active");

  // 2) actualizar header e input
  if (titleEl) titleEl.textContent = name;
  if (inputEl) inputEl.placeholder = `Enviar mensaje a ${name}`;

  // 3) mostrar mensajes de demo (limpia primero)
  if (messagesEl) {
    messagesEl.innerHTML = "";
    const msgs = CHANNEL_MESSAGES[id] || [`Bienvenido a #${name}`];
    msgs.forEach((text) => {
      renderMsg({
        authorName: "Sistema",
        text,
        isSelf: false,
        color: "#5865f2",
      });
    });
  }
}

// Delegación: clic en cualquier .chan
channelsbar?.addEventListener("click", (e) => {
  const btn = e.target.closest(".chan");
  if (!btn) return;
  const id = btn.dataset.channelId;
  const name = btn.dataset.channelName || btn.querySelector("span")?.textContent?.trim() || "Canal";
  if (!id) return;
  setActiveChannel(id, name);
});

// Inicializar con el canal activo al cargar
(function initActiveChannel() {
  const first = document.querySelector(".chan.is-active") || document.querySelector(".chan");
  if (!first) return;
  const id = first.dataset.channelId || "general";
  const name = first.dataset.channelName || first.querySelector("span")?.textContent?.trim() || "General";
  setActiveChannel(id, name);
})();

// ==================== Envío de mensajes ====================
// Importante: NO renderizamos aquí para evitar doble burbuja.
// Dejamos que el servidor haga broadcast y lo pintamos en el handler de socket.
chatForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageInput?.value.trim();
  if (!text) return;

  const tag = currentChannel ? `[${currentChannel.id}] ` : "";
  sendMessage(user.name, tag + text); // solo enviamos
  if (messageInput) messageInput.value = "";
});

// ==================== Emoji picker (con guards) ====================
const emojiBtn = document.querySelector(".emoji-btn");
const emojiPicker = document.getElementById("emojiPicker");

emojiBtn?.addEventListener("click", () => {
  if (!emojiPicker) return;
  const wrap = emojiPicker.parentElement;
  if (!wrap) return;
  wrap.style.display = wrap.style.display === "none" ? "block" : "none";
});

emojiPicker?.addEventListener("emoji-click", (e) => {
  if (!messageInput) return;
  messageInput.value += e.detail.unicode;
});

// ==================== Panel miembros (desde users.json servido por Express) ====================
const MEMBERS_URL = "/api/users"; // << usa la ruta del servidor (opción B)

function normalize(u) {
  return {
    id: u.id,
    name: u.name || u.username,
    tag: u.tag || u.discriminator || "",
    role: (u.rol || u.role || "jugador").toLowerCase(),
    avatar: u.img || u.avatar || "",
    status: (u.status || "offline").toLowerCase(),
  };
}

// color estable para el anillo del avatar
function colorFromString(str = "user") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 70% 60%)`;
}

function renderMembers(groups) {
  const container = document.getElementById("membersScroll");
  if (!container) return;
  container.innerHTML = "";

  const order = ["administrador", "admin", "moderador", "jugador", "user", "miembro"];
  const labels = {
    administrador: "Administradores",
    admin: "Administradores",
    moderador: "Moderadores",
    jugador: "Jugadores",
    user: "Usuarios",
    miembro: "Miembros",
  };

  order.forEach((key) => {
    const list = groups[key];
    if (!list || list.length === 0) return;

    const section = document.createElement("section");
    section.className = "role-group";
    section.innerHTML = `
      <h4 class="role-group__title">${labels[key] || key}
        <span class="count">${list.length}</span>
      </h4>
      <ul class="member-list"></ul>
    `;
    const ul = section.querySelector(".member-list");

    list.forEach((u) => {
      const li = document.createElement("li");
      li.className = "member";
      li.dataset.userId = String(u.id);
      const ring = colorFromString(u.id?.toString() || u.name);

      li.innerHTML = `
        <span class="member__avatar" style="--ring:${ring}">
          ${
            u.avatar
              ? `<img src="${u.avatar}" alt="">`
              : `<img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  u.name
                )}&backgroundType=gradientLinear" alt="">`
          }
        </span>
        <div class="member__meta">
          <div class="member__name">${u.name}</div>
          <div class="member__sub">${u.tag ? "#" + u.tag : ""}</div>
        </div>
        <span class="member__status ${u.status}"></span>
      `;
      ul.appendChild(li);
    });

    container.appendChild(section);
  });
}

async function loadMembers() {
  try {
    const res = await fetch(MEMBERS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar users.json");
    const raw = await res.json();

    const list = raw.map(normalize);
    const groups = {};
    list.forEach((u) => {
      const key = u.role || "miembro";
      (groups[key] ||= []).push(u);
    });
    Object.values(groups).forEach((g) => g.sort((a, b) => a.name.localeCompare(b.name)));

    renderMembers(groups);
  } catch (err) {
    console.warn("users.json no disponible:", err);
    renderMembers({
      administrador: [{ id: 1, name: "Admin", tag: "0001", status: "online", avatar: "" }],
      jugador: [{ id: 2, name: "Usuario", tag: "0002", status: "idle", avatar: "" }],
    });
  }
}
document.addEventListener("DOMContentLoaded", loadMembers);
