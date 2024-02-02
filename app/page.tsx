import * as net from 'net'; import * as http from 'http';

const separatorToken = ' --> '; const SERVER_PORT = 25565;

// Get the server's IP address const getIpAddress = async (): Promise<string> => { return new Promise((resolve, reject) => { http.get('http://api.ipify.org', (res) => { let ipAddress = ''; res.on('data', (chunk) => { ipAddress += chunk; }); res.on('end', () => { resolve(ipAddress); }); }).on('error', (err) => { reject(err); }); }); };

const startServer = async () => { const serverHost = '0.0.0.0'; const host = await getIpAddress();

// Initialize list/set of all connected client's sockets const clientSockets = new Set<net.Socket>();

// Create a TCP server const server = net.createServer();

// Make the port reusable server.on('listening', () => { server.ref(); });

// Bind the server to the address and port server.listen(SERVER_PORT, serverHost, () => { console.log([*] Listening as ${serverHost}:${SERVER_PORT}); console.log([*] REAL Listening as ${host}:${SERVER_PORT}); });

const listenForClient = (clientSocket: net.Socket) => { // Keep listening for messages from the client socket clientSocket.on('data', (data) => { const msg = data.toString(); // Replace the separator token with ": " for nice printing const formattedMsg = msg.replace(separatorToken, ' --> '); console.log(formattedMsg);

  // Broadcast the message to all other connected clients
  for (const socket of clientSockets) {
    if (socket !== clientSocket) {
      socket.write(msg);
    }
  }
});

// Handle client disconnection
clientSocket.on('end', () => {
  console.log(`[!] Client disconnected: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
  clientSockets.delete(clientSocket);
});

// Handle errors
clientSocket.on('error', (err) => {
  console.error(`[!] Server error: ${err}`);
  clientSockets.delete(clientSocket);
});
};

// Listen for new client connections server.on('connection', (clientSocket) => { console.log([+] Client connected: ${clientSocket.remoteAddress}:${clientSocket.remotePort}); clientSockets.add(clientSocket); listenForClient(clientSocket); }); };

startServer();
