import { login } from "./services/api.js";
import { showError, clearError, saveUser, redirectToChat } from "./ui/loginUI.js";

// Botón
const loginForm = document.getElementById("loginForm");

// Eventos
loginForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    clearError();

    try {
        // Failsafe porque esto no puede suceder
        if (!username || !password) {
            showError("Debes ingresar usuario y contraseña");
            return;
        }

        // Llamar backend
        const data = await login(username, password);

        // Guardar y redirigir
        saveUser(data.user);
        redirectToChat();
    } catch (err) {
        console.error("Error de login:", err);
        showError(err.message || "Credenciales inválidas");
    }
});
