// ===== refs
const messagesDiv = document.getElementById("messages");
const userList    = document.getElementById("userList");

// Mantén el alto del contenedor del chat
function fixChatHeight() {
  const cont = document.querySelector(".chat-container");
  if (cont) cont.style.height = window.innerHeight + "px";
}
window.addEventListener("resize", fixChatHeight);
fixChatHeight();

// ===== helpers
function colorFromString(str = "user") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 70% 60%)`;
}

/**
 * addMessage - pinta un mensaje .msg
 * @param {Object} opts
 *  - author: string (nombre a mostrar)
 *  - text:   string (contenido)
 *  - isSelf: boolean (alineación derecha/izquierda)
 *  - avatar: string|null (url de imagen; si no hay, usa ícono)
 */
export function addMessage({ author = "Usuario", text = "", isSelf = false, avatar = null } = {}) {
  const messagesEl = document.getElementById("messages");
  if (!messagesEl) return;

  const msg = document.createElement("div");
  msg.className = `msg ${isSelf ? "-self" : "-other"}`;

  const avatarEl = document.createElement("div");
  avatarEl.className = "msg__avatar";

  if (avatar) {
    avatarEl.classList.add("has-img");
    avatarEl.innerHTML = `<img src="${avatar}" alt="${author}">`;
  } else {
    // fallback: color estable + icono
    avatarEl.style.setProperty("--av", colorFromString(author));
    avatarEl.innerHTML = '<i class="fa-regular fa-user"></i>';
  }

  const label = document.createElement("div");
  label.className = "msg__label";
  label.textContent = author;

  const bubble = document.createElement("div");
  bubble.className = "msg__bubble";
  bubble.textContent = text;

  // Orden correcto para el grid 2x2
  msg.appendChild(avatarEl); // col1/fila2 (o col2 si -self por CSS)
  msg.appendChild(label);    // col2/fila1 (o col1 si -self por CSS)
  msg.appendChild(bubble);   // col2/fila2 (o col1 si -self por CSS)

  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

export function addSystemMessage(text) {
  const msgEl = document.createElement("div");
  msgEl.classList.add("message", "system");
  msgEl.innerHTML = `<em>⚙️ ${text}</em>`;
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ===== lista de usuarios (panel de miembros) =====
export function updateUserList(users = []) {
  if (!userList) return;
  const arr = Array.isArray(users) ? users : [];
  userList.innerHTML = "";

  arr.forEach((u) => {
    const li = document.createElement("li");
    li.className = "user-item";
    li.innerHTML = `
      <div class="user-avatar">
        <img src="${u.img || u.avatar || ""}" alt="${u.name || ""}" class="avatar-img">
        <span class="status ${u.connected ? "online" : "offline"}"></span>
      </div>
      <div class="user-info">
        <span class="user-name">${u.name || "Usuario"}</span>
        <small class="user-role">${u.rol || u.role || ""}</small>
      </div>
    `;
    userList.appendChild(li);
  });
}

// Mostrar/ocultar el panel de miembros
export function showUserList(list, show) {
  if (!list) return;
  list.classList.toggle("is-visible", !!show);
}

// Sesión
export function clearUser() {
  localStorage.removeItem("user");
  localStorage.removeItem("username");
}

export function redirectToLogin() {
  window.location.href = "/login.html";
}

export function updateMembersPresence(serverUsers = []) {
  const byId = new Map(serverUsers.map(u => [String(u.id), !!u.connected]));
  document.querySelectorAll('.member[data-user-id]').forEach(li => {
    const id  = li.dataset.userId;
    const dot = li.querySelector('.member__status');
    if (!dot) return;
    const isOnline = byId.get(id);
    dot.classList.remove('online','idle','dnd','offline');
    dot.classList.add(isOnline ? 'online' : 'offline');
  });
}
