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

// ===== mensajes =====
export function addMessage(authorName, text, isSelf = false) {
  const messagesEl = document.getElementById("messages");
  if (!messagesEl) return;

  const msg = document.createElement("div");
  msg.className = `msg ${isSelf ? "-self" : "-other"}`;

  const avatar = document.createElement("div");
  avatar.className = "msg__avatar";
  avatar.style.setProperty("--av", "hsl(260 70% 60%)"); // o tu helper de color
  avatar.innerHTML = '<i class="fa-regular fa-user"></i>';

  const label = document.createElement("div");
  label.className = "msg__label";
  label.textContent = authorName;

  const bubble = document.createElement("div");
  bubble.className = "msg__bubble";
  bubble.textContent = text;

  // Orden correcto para el grid 2x2
  msg.appendChild(avatar);  // col1/fila2
  msg.appendChild(label);   // col2/fila1
  msg.appendChild(bubble);  // col2/fila2

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
  if (!userList) return; // evita crash si aún no existe en el DOM
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
  // según tu app, se guarda como "user" (objeto); borramos ambos por si acaso
  localStorage.removeItem("user");
  localStorage.removeItem("username");
}

export function redirectToLogin() {
  window.location.href = "/login.html";
}



