const { getUsers } = require("../models/users");

function handleAuthRoutes(req, res) {
    if (req.url.startsWith("/api/login")) {
        const method = req.method;

        // POST /api/login
        if (method === "POST") {
            let body = "";
            req.on("data", chunk => (body += chunk));
            req.on("end", () => {
                try {
                    const { name, password } = JSON.parse(body);
                    const users = getUsers();
                    const user = users.find(u => u.name === name && u.password === password);
                    if (!user) {
                        res.writeHead(401);
                        res.end(JSON.stringify({ error: "Credenciales inválidas" }));
                        return;
                    }
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        message: "Login exitoso",
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            rol: user.rol,
                            img: user.img
                        }
                    }));
                } catch (err) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "JSON inválido" }));
                }
            });
            return true;
        }
    }

    return false;
}

module.exports = handleAuthRoutes;