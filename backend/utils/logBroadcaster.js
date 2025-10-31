const clients = new Set();

function addClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

function publish(log) {
  const data = JSON.stringify(log);
  for (const res of clients) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (err) {
      // ignore write errors
    }
  }
}

module.exports = { addClient, removeClient, publish };
