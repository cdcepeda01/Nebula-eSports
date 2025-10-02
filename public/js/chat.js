import { connect, sendMessage, setChannel } from "./web/chatSocket.js";
import { clearUser, redirectToLogin } from "./ui/chatUI.js";

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

  nameEl.textContent = u.name || "Usuario";
  roleEl.textContent = (u.rol || u.role || "user").toUpperCase();
  tagEl.textContent  = `#${String(u.id ?? "").toString().padStart(4,"0")}`;
  onlineEl.textContent = "· En línea";
  avatarEl.src = u.img || u.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(u.name || "User");
  avatarEl.alt = u.name || "Usuario";
  statusEl.classList.remove("offline");
  statusEl.classList.add("online");
}
renderFooterUser(user);

// Header
const titleHeader = document.getElementById("chat-username");
if (titleHeader) titleHeader.textContent = "Bienvenido " + user.name;

// ==================== Referencias DOM ====================
const chatForm       = document.getElementById("chatForm");
const messageInput   = document.getElementById("messageInput");
const logoutBtn      = document.getElementById("logoutBtn");
const sidebar        = document.getElementById("userSidebar");
const toggleBtn      = document.getElementById("usersToggle");
const closeBtn       = document.getElementById("closeSidebar");
const channelsbar    = document.querySelector(".channelsbar");
const titleEl        = document.getElementById("chat-username");
const inputEl        = document.getElementById("messageInput");
const messagesEl     = document.getElementById("messages");
const notifBtn       = document.getElementById("notifBtn");                 // campanita sidebar
const searchInput    = document.querySelector('.channelsbar__search input'); // sidebar
const openChannelsBtn= document.getElementById("openChannels");             // botón ☰ header

// === Dock móvil ===
const mobileServers = document.getElementById("mobileServers");
const mobileSearch  = document.getElementById("mobileSearch");
const mbNotif       = document.getElementById("mbNotif");
const dock          = document.getElementById("mobileDock");

// ==================== Conectar WebSocket ====================
connect(user);

// ==================== Eventos básicos ====================
logoutBtn?.addEventListener("click", () => {
  clearUser();
  redirectToLogin();
});

// === Sidebar Miembros ===
toggleBtn?.addEventListener("click", () => {
  sidebar?.classList.toggle("is-visible");
});
closeBtn?.addEventListener("click", () => {
  sidebar?.classList.remove("is-visible");
});

// === Drawer de canales (móvil) ===
openChannelsBtn?.addEventListener("click", () => {
  // en móvil abre el drawer; en desktop no afecta
  if (window.innerWidth <= 900) channelsbar?.classList.add("is-open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    channelsbar?.classList.remove("is-open");
    sidebar?.classList.remove("is-visible");
  }
});

// ==================== Render de mensajes de sistema (para demos de canal) ====================
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

  msg.appendChild(avatar);
  msg.appendChild(label);
  msg.appendChild(bubble);

  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ==================== Canales ====================
let currentChannel = null;

// 💾 Cache DOM por canal
const channelDOMCache = {};

const ANNOUNCEMENTS = [
  "🏆 ¡Copa Nebula – Inscripciones abiertas hasta el viernes!",
  "🕒 Mañana 20:00 – Clasificatorio Valorant (BO3).",
  "🎁 Giveaway: skins para los 3 mejores del mes.",
  "📢 Nuevo formato LoL: partidas al mejor de 1 en fase de grupos.",
  "👥 Busca equipo: canal #reclutamiento para armar roster.",
  "📺 Finales streameadas este domingo en Twitch /NebulaESports",
  "🛠️ Mantenimiento del servidor el sábado 02:00–03:00 UTC.",
  "📝 Reglas actualizadas: comportamiento y fair play. Revísalas.",
  "🧭 Bracket publicado: ver #torneos → Brackets.",
  "💬 Charla con pro invitado el jueves 19:00."
];

const CHANNEL_MESSAGES = {
  general: ["Bienvenido a #General", "Recuerda las reglas ✨"],
  gaming:  ["Hablemos de juegos hoy", "¿Qué estás jugando hoy? 🕹️"],
  ideas:   ["Deja tus sugerencias aquí", "💡 Idea #1: ..."],
  leagueoflegends: ["Bienvenido a #LeagueOfLegends", "¿Quién se apunta a un Lolsito? 🎮"],
  valorant: ["Bienvenido a #Valorant", "¿Quién juega hoy Valorant? 🔥"],
  fortnite: ["Bienvenido a #Fortnite", "¿Listos para unas partidas? 🏆"],
  ayuda:   ["¿Necesitas ayuda?", "❓ Deja tus preguntas aquí"],
};

// util para aleatorizar
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setActiveChannel(id, name) {
  const readonly = (id === "anuncios");

  // Guarda el DOM del canal actual antes de cambiar
  if (currentChannel && messagesEl) {
    channelDOMCache[currentChannel.id] = messagesEl.innerHTML;
  }

  currentChannel = { id, name, readonly };

  // activar botón
  document.querySelectorAll(".chan.is-active").forEach((b) => b.classList.remove("is-active"));
  document.querySelector(`.chan[data-channel-id="${id}"]`)?.classList.add("is-active");

  // header & placeholder
  if (titleEl) titleEl.textContent = name;
  if (inputEl) inputEl.placeholder = readonly ? "Canal de anuncios (solo lectura)" : `Enviar mensaje a ${name}`;
  chatForm?.classList.toggle("is-readonly", readonly);

  // render inicial
  if (!messagesEl) return;

  messagesEl.innerHTML = "";

  // 🔁 Restaurar si hay caché para este canal
  if (channelDOMCache[id]) {
    messagesEl.innerHTML = channelDOMCache[id];
    // Scroll al final del main (contenedor scrollable)
    const main = document.querySelector('.chat-main');
    main?.scrollTo({ top: main.scrollHeight });
    // avisar al servidor igual
    setChannel(id);
    return;
  }

  // Si NO había caché, sembramos mensajes de demo como antes
  if (readonly) {
    shuffle(ANNOUNCEMENTS).slice(0, 5).forEach((text) => {
      renderMsg({ authorName: "Sistema", text, isSelf:false, color:"#5865f2" });
    });
  } else {
    const msgs = CHANNEL_MESSAGES[id] || [`Bienvenido a #${name}`];
    msgs.forEach((text) => {
      renderMsg({ authorName: "Sistema", text, isSelf:false, color:"#5865f2" });
    });
  }

  // avisar al servidor el canal actual
  setChannel(id);
}

// cambiar canal por click (desktop + móvil)
channelsbar?.addEventListener("click", (e) => {
  const btn = e.target.closest(".chan");
  if (!btn) return;
  const id   = btn.dataset.channelId;
  const name = btn.dataset.channelName || btn.querySelector("span")?.textContent?.trim() || "Canal";
  if (!id) return;

  setActiveChannel(id, name);

  // --- cierre automático en móvil ---
  if (window.innerWidth <= 900) {
    channelsbar.classList.remove("is-open");   // cierra drawer de canales
    sidebar?.classList.remove("is-visible");   // cierra panel de miembros si estaba abierto
  }

  // llevar chat al final y enfocar input
  const main = document.querySelector('.chat-main');
  main?.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
  inputEl?.focus();
});

// campanita → Anuncios (sidebar)
notifBtn?.addEventListener("click", () => {
  setActiveChannel("anuncios", "Anuncios");
  if (window.innerWidth <= 900) channelsbar?.classList.remove("is-open");
});

// canal inicial
(function initActiveChannel() {
  const first = document.querySelector(".chan.is-active") || document.querySelector(".chan");
  if (!first) return;
  const id   = first.dataset.channelId || "general";
  const name = first.dataset.channelName || first.querySelector("span")?.textContent?.trim() || "General";
  setActiveChannel(id, name);
})();

// ==================== Envío de mensajes ====================
chatForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentChannel || currentChannel.readonly) return;

  const text = messageInput?.value.trim();
  if (!text) return;

  // 👇 enviamos el objeto user completo (para avatar/nombre correctos)
  sendMessage(user, text, currentChannel.id);
  if (messageInput) messageInput.value = "";
});

// ==================== Emoji picker ====================
const emojiBtn = document.querySelector(".emoji-btn");
const emojiPicker = document.getElementById("emojiPicker");

emojiBtn?.addEventListener("click", () => {
  if (!emojiPicker) return;
  const wrap = emojiPicker.parentElement;
  if (!wrap) return;
  const hidden = getComputedStyle(wrap).display === "none";
  wrap.style.display = hidden ? "block" : "none";
});
emojiPicker?.addEventListener("emoji-click", (e) => {
  if (!messageInput) return;
  messageInput.value += e.detail.unicode;
});

// ==================== Panel miembros (desde /api/users) ====================
const MEMBERS_URL = "/api/users";

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
function colorFromString(str = "user") {
  let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 70% 60%)`;
}
function renderMembers(groups) {
  const container = document.getElementById("membersScroll");
  if (!container) return;
  container.innerHTML = "";
  const order = ["administrador","admin","moderador","jugador","user","miembro"];
  const labels = { administrador:"Administradores", admin:"Administradores", moderador:"Moderadores", jugador:"Jugadores", user:"Usuarios", miembro:"Miembros" };

  order.forEach((key) => {
    const list = groups[key];
    if (!list?.length) return;

    const section = document.createElement("section");
    section.className = "role-group";
    section.innerHTML = `
      <h4 class="role-group__title">${labels[key] || key}
        <span class="count">${list.length}</span>
      </h4>
      <ul class="member-list"></ul>`;
    const ul = section.querySelector(".member-list");

    list.forEach((u) => {
      const li = document.createElement("li");
      li.className = "member";
      li.dataset.userId = String(u.id);
      const ring = colorFromString(u.id?.toString() || u.name);
      li.innerHTML = `
        <span class="member__avatar" style="--ring:${ring}">
          ${ u.avatar
              ? `<img src="${u.avatar}" alt="">`
              : `<img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundType=gradientLinear" alt="">` }
        </span>
        <div class="member__meta">
          <div class="member__name">${u.name}</div>
          <div class="member__sub">${u.tag ? "#" + u.tag : ""}</div>
        </div>
        <span class="member__status ${u.status}"></span>`;
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
    list.forEach((u) => { const key = u.role || "miembro"; (groups[key] ||= []).push(u); });
    Object.values(groups).forEach((g) => g.sort((a,b) => a.name.localeCompare(b.name)));
    renderMembers(groups);
  } catch (err) {
    console.warn("users.json no disponible:", err);
    renderMembers({
      administrador: [{ id: 1, name: "Admin", tag: "0001", status: "online", avatar: "" }],
      jugador:       [{ id: 2, name: "Usuario", tag: "0002", status: "idle",   avatar: "" }],
    });
  }
}
document.addEventListener("DOMContentLoaded", loadMembers);

// ===== Theme Toggle via footer menu =====
const userMenuBtn  = document.getElementById('userMenuBtn');
const userMenu     = document.getElementById('userMenu');
const themeToggle  = document.getElementById('themeToggle');
const logoutQuick  = document.getElementById('logoutQuick');

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (themeToggle) themeToggle.checked = (theme === 'light');
}
const savedTheme = localStorage.getItem('theme')
  || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
applyTheme(savedTheme);

userMenuBtn?.addEventListener('click', (e)=>{
  e.stopPropagation();
  if (!userMenu) return;
  const hidden = userMenu.hasAttribute('hidden');
  if (hidden) userMenu.removeAttribute('hidden');
  else userMenu.setAttribute('hidden','');
});
document.addEventListener('click', (e)=>{
  if (!userMenu) return;
  const inside = userMenu.contains(e.target) || userMenuBtn.contains(e.target);
  if (!inside) userMenu.setAttribute('hidden','');
});
themeToggle?.addEventListener('change', (e)=> applyTheme(e.target.checked ? 'light' : 'dark'));
logoutQuick?.addEventListener('click', ()=>{
  localStorage.removeItem('user');
  window.location.href = '/login.html';
});

// ==================== Filtro de canales (Search) ====================
function normalizeFold(str = "") {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
function filterChannels(queryRaw) {
  const q = normalizeFold(queryRaw.trim());
  const chanButtons = Array.from(document.querySelectorAll('.chan'));

  // limpiar resaltado previo
  chanButtons.forEach(btn => {
    const label = btn.querySelector('span');
    if (!label) return;
    if (!label.dataset.raw) label.dataset.raw = label.textContent;
    label.innerHTML = label.dataset.raw;
    btn.classList.remove('is-hidden');
  });

  if (!q) {
    document.querySelectorAll('.cat').forEach(cat => { cat.style.display = ''; });
    return;
  }

  chanButtons.forEach(btn => {
    const label = btn.querySelector('span');
    const text  = label?.dataset.raw || '';
    const norm  = normalizeFold(text);

    if (!norm.includes(q)) {
      btn.classList.add('is-hidden');
      return;
    }
    const idx = norm.indexOf(q);
    const before = text.slice(0, idx);
    const mid    = text.slice(idx, idx + q.length);
    const after  = text.slice(idx + q.length);
    label.innerHTML = `${before}<mark class="chan__hl">${mid}</mark>${after}`;
  });

  // ocultar categorías sin resultados y abrir las que sí tienen
  document.querySelectorAll('.cat').forEach(cat => {
    const hasVisible = cat.querySelector('.chan:not(.is-hidden)');
    cat.style.display = hasVisible ? '' : 'none';
    if (hasVisible) cat.setAttribute('open', '');
  });
}
searchInput?.addEventListener('input', (e) => filterChannels(e.target.value));
searchInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.currentTarget.value = '';
    filterChannels('');
    e.currentTarget.blur();
  }
});
