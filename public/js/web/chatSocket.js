import { addMessage, addSystemMessage, updateUserList, updateMembersPresence } from "../ui/chatUI.js";
let socket;

// elimina etiquetas tipo [general] al inicio del texto
const stripChannelTag = (t = "") => String(t).replace(/^\[[^\]]+\]\s*/, "");

export function connect(user) {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const wsUrl   = isLocal ? `ws://${location.host}` : `wss://${location.host}`;

  socket = new WebSocket(wsUrl);

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ type: "login", user }));
  });

  socket.addEventListener("message", (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }

    switch (data.type) {
      case "chat": {
        const isSelf = data.user === user.name;
        const text   = stripChannelTag(data.text || "");
        // addMessage debe pintar la estructura .msg (avatar + label + bubble)
        addMessage(data.user, text, isSelf);
        break;
      }
      case "system":
        addSystemMessage(data.text || "");
        break;
      case "users":
        updateUserList?.(data.users || []);        
        updateMembersPresence?.(data.users || []);
        break;
    }
  });

  socket.addEventListener("close", () => addSystemMessage("Conexión cerrada"));
  socket.addEventListener("error", () => addSystemMessage("Error de conexión"));
}

export function sendMessage(userName, text) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const cleaned = String(text ?? "").trim();
  if (!cleaned) return;

  socket.send(JSON.stringify({
    type: "chat",
    user: userName,
    text: cleaned
  }));
}
