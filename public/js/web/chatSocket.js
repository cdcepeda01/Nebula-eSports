// js/web/chatSocket.js
import { addMessage, addSystemMessage, updateUserList, updateMembersPresence } from "../ui/chatUI.js";

let socket;

const stripChannelTag = (t = "") => String(t).replace(/^\[[^\]]+\]\s*/, "");

export function connect(user) {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const wsUrl   = isLocal ? `ws://${location.host}` : `wss://${location.host}`;

  socket = new WebSocket(wsUrl);

  socket.addEventListener("open", () => {
    // enviamos el user objeto en el login
    socket.send(JSON.stringify({ type: "login", user }));
  });

  socket.addEventListener("message", (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }

    switch (data.type) {
      case "chat": {
        const text = stripChannelTag(data.text || "");

        // Puede llegar user como string (compat) o como objeto (nuevo)
        let author = "Usuario";
        let avatar = null;
        let isSelf = false;

        if (data.user && typeof data.user === "object") {
          author = data.user.name || "Usuario";
          avatar = data.user.img || null;
          isSelf = String(data.user.id) === String(user.id);
        } else {
          author = String(data.user || "Usuario");
          isSelf = author === user.name; // fallback por si llegara string
        }

        addMessage({ author, text, isSelf, avatar });
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

export function setChannel(channelId) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "join", channel: channelId }));
}

export function sendMessage(userObj, text, channelId) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const cleaned = String(text ?? "").trim();
  if (!cleaned) return;

  // enviamos el user como objeto para que viaje el avatar y el id
  socket.send(JSON.stringify({
    type: "chat",
    user: { id: userObj.id, name: userObj.name, img: userObj.img, rol: userObj.rol },
    channel: channelId,
    text: cleaned
  }));
}
