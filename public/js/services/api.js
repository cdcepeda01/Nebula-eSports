const API_USERS_URL = "/api/users";
const API_LOGIN_URL = "/api/login";

export async function login(name, password) {
    const res = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password })
    });
    
    if (!res.ok) throw new Error("Credenciales inválidas");
    return res.json();
}

export async function getUsers() {
    const res = await fetch(API_USERS_URL);

    if (!res.ok) throw new Error("Error al cargar items");
    return res.json();
}

export async function getUser(id) {
    const res = await fetch(`${API_USERS_URL}/${id}`);

    if (!res.ok) throw new Error("Usuario no encontrado");
    return res.json();
}

export async function createUser(data) {
    const res = await fetch(API_USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Error al crear usuario");
    return res.json();
}

export async function updateUser(id, data) {
    const res = await fetch(`${API_USERS_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Error al actualizar usuario");
    return res.json();
}

export async function deleteUser(id) {
    const res = await fetch(`${API_USERS_URL}/${id}`, { method: "DELETE" });
    
    if (!res.ok) throw new Error("Error al eliminar usuario");
    return res.json();
}