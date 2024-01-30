const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const path = require("path");

const { addConndection } = require("./vncClient");

const { spawn } = require("child_process");

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

let sshTunnel;
let isExited = false;
let isConnected = false;
let sshTunnelPID = null;
const { EventEmitter } = require("node:events");

const myConnection = new EventEmitter();

const startTunnel = async (command) => {
  try {
    sshTunnel = spawn(command, {
      detached: true,
      stdio: "ignore",
      shell: true,
    });
    console.log(`SSH tunnel ProcessID ${sshTunnel.pid}`);

    sshTunnel.unref();

    sshTunnel.on("message", (message) => {
      console.log(message);
    });

    sshTunnel.on("exit", (code, signal) => {
      if (code === 0) {
        console.log(`tunnel established`);
        // Perform actions after the tunnel is established
      } else if (code !== null) {
        console.log(`SSH tunnel exited ${code}`);
        // if (!isExited) startTunnel(command);
      } else if (signal !== null) {
        console.log(`SSH tunnel killed ${signal}`);
        // if (!isExited) startTunnel(command);
      }
    });

    sshTunnel.on("close", (code, signal) => {
      console.log(`SSH Tunnel Closed`);
      if (code === 0) {
        console.log(`Tunnel Established`);
      }
      if (!isExited) startTunnel(command);
    });

    sshTunnel.on("error", (err) => {
      console.log(`SSH Error ${err.message}`);
      // if (!isExited) startTunnel(command);
    });
  } catch (err) {
    throw new Error(err.message);
  }
};

app.get("/bauerScreen/:port", async (req, res) => {
  try {
    // const port = Number(req.params.port);
    // const screenCommand = "ssh -N -L 8001:127.0.0.1:8000 osama@192.168.1.7";

    // await startTunnel(screenCommand);

    // sshTunnelPID = sshTunnel.pid;

    // process.on("SIGINT", () => {
    //   isExited = true;
    //   console.log(sshTunnelPID);
    //   if (sshTunnelPID) {
    //     process.kill(-sshTunnelPID);
    //     process.kill(sshTunnelPID);
    //     sshTunnelPID = null;
    //   }
    //   process.exit();
    // });
    // setInterval(() => {
    //   if (sshTunnel.pid) myConnection.emit("connected");
    // }, 5000);
    // console.log(`Connected => ${sshTunnel.pid}`);
    // myConnection.on("connected", () => {
    //   if (!isConnected) {
    //     console.log("SSH Connected");
    res.sendFile(`${__dirname}/display.html`);

    //     isConnected = true;
    //   }
    // });
  } catch (err) {
    console.error("Error:", err.message);
  }
});

server.listen(5004, () => {
  console.log(`Server is listening on port 5004`);
});
