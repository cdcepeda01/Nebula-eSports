const { getUsers, saveUsers } = require("../models/users");

function handleUsersRoutes(req, res) {
    if (req.url.startsWith("/api/users")) {
        const method = req.method;
        const parts = req.url.split("/").filter(Boolean);
        const id = parts[2] ? parseInt(parts[2]) : null;

        // GET /api/users
        if (method === "GET" && parts.length === 2) {
            const users = getUsers();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(users));
            return true;
        }

        // GET /api/users/:id
        if (method === "GET" && parts.length === 3 && id) {
            const users = getUsers();
            const user = users.find(u => u.id === id);
            if (!user) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: "Usuario no encontrado" }));
                return true;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(user));
            return true;
        }

        // POST /api/users
        if (method === "POST" && parts.length === 2) {
            let body = "";
            req.on("data", chunk => (body += chunk));
            req.on("end", () => {
                try {
                    const { name, password, email, rol, img } = JSON.parse(body);
                    if (!name || !password || !email) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: "Faltan campos obligatorios" }));
                        return;
                    }
                    const users = getUsers();
                    const newUser = {
                        id: users.length ? users[users.length - 1].id + 1 : 1,
                        name,
                        password,
                        email,
                        rol: rol || "user",
                        img: img || "https://i.pravatar.cc/150"
                    };
                    users.push(newUser);
                    saveUsers(users);
                    res.writeHead(201, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(newUser));
                } catch (err) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "JSON inválido" }));
                }
            });
            return true;
        }

        // PUT /api/users/:id
        if (method === "PUT" && parts.length === 3 && id) {
            let body = "";
            req.on("data", chunk => (body += chunk));
            req.on("end", () => {
                try {
                    const update = JSON.parse(body);
                    const users = getUsers();
                    const index = users.findIndex(u => u.id === id);
                    if (index === -1) {
                        res.writeHead(404);
                        res.end(JSON.stringify({ error: "Usuario no encontrado" }));
                        return;
                    }
                    users[index] = { ...users[index], ...update, id };
                    saveUsers(users);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(users[index]));
                } catch (err) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "JSON inválido" }));
                }
            });
            return true;
        }

        // DELETE /api/users/:id
        if (method === "DELETE" && parts.length === 3 && id) {
        const users = getUsers();
        const newUsers = users.filter(u => u.id !== id);
        if (newUsers.length === users.length) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Usuario no encontrado" }));
            return true;
        }
        saveUsers(newUsers);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Usuario eliminado" }));
        return true;
        }
    }

    return false;
}

module.exports = handleUsersRoutes;
