function broadcast(users, data) {
    const msg = JSON.stringify(data);
    users.forEach(u => {
        if (u.ws.readyState === 1) {
            u.ws.send(msg);
        }
    });
}

module.exports = broadcast;