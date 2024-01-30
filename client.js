const Client = require("ssh2").Client;
const net = require("net");
const fs = require("fs");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const path = require("path");
const { client, addConndection } = require("./vncClient");

let users = {};
let rooms = {};

const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(`New Connection ${socket.id}`);

  socket.on("join-message", (roomId) => {
    console.log("join-message triggered");
    socket.join(roomId);
    rooms = { ...rooms, [socket.id]: roomId };
    console.log(rooms);
    addConndection(socket);
    // console.log("User joined in a room : " + roomId);
  });
  socket.on("request-image", (data) => {
    console.log("request-image triggered");
    addConndection(socket);
  });

  socket.on("screen-data", function (data) {
    console.log("screen-data triggered");
    data = JSON.parse(data);
    var room = data.room;
    var imgStr = data.image;
    socket.broadcast.to(room).emit("screen-data", imgStr);
  });

  socket.on("disconnect", () => {
    console.log(`${users[socket?.id]} Connection Lost`);
    delete rooms[socket?.id];
    delete users[socket?.id];
    console.log(rooms);
  });
});

const sshConfig = {
  host: "192.168.1.7",
  port: 22,
  username: "osama",
  privateKey: fs.readFileSync("/home/mohamed/.ssh/id_rsa"),
};

const localAddress = "127.0.0.1";
const localPort = 8001;
const remoteAddress = "127.0.0.1";
const remotePort = 8000;
let conn = null;

async function createTunnel() {
  if (!conn) {
    return new Promise((resolve, reject) => {
      conn = new Client();

      conn.on("ready", () => {
        console.log(
          "SSH connection established. Creating local port forward..."
        );

        // Create a TCP server that listens on 127.0.0.1:8001
        const server = net.createServer((localStream) => {
          conn.forwardOut(
            localAddress,
            localPort,
            remoteAddress,
            remotePort,
            (err, stream) => {
              if (err) {
                console.error("Error creating local port forward:", err);
                conn.end();
                server.close();
                reject(err);
              }
              console.log(`Forwarded`);
              // console.log(client);

              //   client._connection.on("connect", () => {
              client._connected = true;
              client.emit("connected");
              //   });

              client._connection.on("close", () => {
                client.resetState();
                client.emit("closed");
              });

              client._connection.on("timeout", () => {
                client.emit("connectTimeout");
              });

              client._connection.on("error", (err) => {
                client.emit("connectError", err);
              });

              client._connection.on("data", async (data) => {
                client._log(data.toString(), true, 5);
                client._socketBuffer.pushData(data);

                if (client._processingFrame) {
                  return;
                }

                if (!client._handshaked) {
                  client._handleHandshake();
                } else if (client._expectingChallenge) {
                  await client._handleAuthChallenge();
                } else if (client._waitingServerInit) {
                  await client._handleServerInit();
                } else {
                  await client._handleData();
                }
              });

              // Pipe the local connection to the remote server through the SSH tunnel
              localStream.pipe(stream).pipe(localStream);
            }
          );
        });

        // Handle local server close event
        server.on("close", () => {
          console.log("Local port forward server closed");
        });

        // Handle local server error event
        server.on("error", (err) => {
          console.error("Local port forward server error:", err);
          conn.end();
          reject(err);
        });

        // Listen for the 'listening' event to ensure the server is fully ready
        server.listen(localPort, localAddress, () => {
          console.log(
            `Local port forward server listening on ${localAddress}:${localPort}`
          );
          resolve({ server, conn });
        });
      });

      // Handle SSH connection close event
      conn.on("close", () => {
        console.log("SSH connection closed");
      });

      // Handle SSH connection error event
      conn.on("error", (err) => {
        console.error("SSH connection error:", err);
        reject(err);
      });

      conn.connect(sshConfig);
    });
  }
}

app.get("/bauerScreen/:port", async (req, res) => {
  try {
    await createTunnel();
    return res.sendFile(`${__dirname}/display.html`);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  //   const port = Number(req.params.port);

  //   const localAddress = "127.0.0.1";
  //   const localPort = 8001;
  //   const remoteAddress = "127.0.0.1";
  //   const remotePort = 8000;

  //   const conn = new Client();

  //   conn.on("ready", () => {
  //     console.log("SSH connection established. Creating local port forward...");

  //     // Create a TCP server that listens on 192.168.1.8:8001
  //     const server = net.createServer((localStream) => {
  //       conn.forwardOut(
  //         localAddress,
  //         localPort,
  //         remoteAddress,
  //         remotePort,
  //         (err, stream) => {
  //           if (err) {
  //             console.error("Error creating local port forward:", err);
  //             conn.end();
  //             server.close();
  //           }

  //           // Pipe the local connection to the remote server through the SSH tunnel
  //           localStream.pipe(stream).pipe(localStream);
  //         }
  //       );
  //     });

  //     // Handle local server close event
  //     server.on("close", () => {
  //       console.log("Local port forward server closed");
  //     });

  //     // Handle local server error event
  //     server.on("error", (err) => {
  //       console.error("Local port forward server error:", err);
  //       conn.end();
  //     });

  //     server.listen(localPort, localAddress, () => {
  //       console.log(
  //         `Local port forward server listening on ${localAddress}:${localPort}`
  //       );
  //       setTimeout(() => {
  //         res.sendFile(`${__dirname}/display.html`);
  //       }, 20000);
  //     });
  //   });

  //   // Handle SSH connection close event
  //   conn.on("close", () => {
  //     console.log("SSH connection closed");
  //   });

  //   // Handle SSH connection error event
  //   conn.on("error", (err) => {
  //     console.log(`SSH connection error: ${err.message}`);
  //   });

  //   conn.connect(sshConfig);
});

server.listen(5004, () => {
  console.log(`Server is listening on port 5004`);
});
