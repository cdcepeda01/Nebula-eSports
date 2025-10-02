// web/chat.js
const broadcast = require("../utils/broadcast");
const { getUsers } = require("../models/users");

let users = [];

function setupChat(wss) {
  wss.on("connection", (ws, req) => {
    let currentUser = null;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;

    ws.on("message", (msg) => {
      const data = JSON.parse(msg);

      // --- LOGIN ---
      if (data.type === "login") {
        currentUser = {
          id: data.user.id,
          name: data.user.name,
          img: data.user.img,
          rol: data.user.rol,
          channel: "general",  // por defecto
          ws
        };
        users.push(currentUser);

        console.log(`${new Date().toISOString()} - 🟢 Cliente conectado (${currentUser.name} | ${ip})`);

        broadcast(users, { type: "system", text: `${currentUser.name} se unió` });

        const allUsers = getUsers();
        broadcast(users, {
          type: "users",
          users: allUsers.map(u => ({
            id: u.id,
            name: u.name,
            rol: u.rol,
            img: u.img,
            connected: users.some(c => String(c.id) === String(u.id))
          }))
        });
        return;
      }

      // --- CAMBIO DE CANAL ---
      if (data.type === "join") {
        const next = data.channel || "general";
        if (currentUser) currentUser.channel = next;
        return;
      }

      // --- MENSAJE DE CHAT ---
      if (data.type === "chat") {
        const channel = data.channel || currentUser?.channel || "general";

        const payload = { type: "chat", user: data.user ?? { id: currentUser?.id, name: currentUser?.name, img: currentUser?.img }, text: data.text, channel };

        const inSameChannel = users.filter(u => u.channel === channel);
        broadcast(inSameChannel, payload);
        return;
      }
    });

    ws.on("close", () => {
      if (!currentUser) return;
      console.log(`${new Date().toISOString()} - 🔴 Cliente desconectado (${currentUser.name} | ${ip})`);
      users = users.filter(u => u !== currentUser);

      broadcast(users, { type: "system", text: `${currentUser.name} salió` });

      const allUsers = getUsers();
      broadcast(users, {
        type: "users",
        users: allUsers.map(u => ({
          id: u.id,
          name: u.name,
          rol: u.rol,
          img: u.img,
          connected: users.some(c => String(c.id) === String(u.id))
        }))
      });
    });
  });
}

module.exports = setupChat;
