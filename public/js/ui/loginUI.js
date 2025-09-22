export function showError(message) {
    const errorEl = document.getElementById("loginError");
    errorEl.textContent = message;
}

export function clearError() {
    const errorEl = document.getElementById("loginError");
    errorEl.textContent = "";
}

export function saveUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

export function redirectToChat() {
    window.location.href = "/chat.html";
}