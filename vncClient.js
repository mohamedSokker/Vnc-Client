// const VncClient = require("vnc-rfb-client");
const VncClient = require("./vncmodules/vncclient");
const Jimp = require("jimp");

const initOptions = {
  debug: false, // Set debug logging
  encodings: [
    // Encodings sent to server, in order of preference
    VncClient.consts.encodings.copyRect,
    VncClient.consts.encodings.zrle,
    VncClient.consts.encodings.hextile,
    VncClient.consts.encodings.raw,
    VncClient.consts.encodings.pseudoDesktopSize,
    VncClient.consts.encodings.pseudoCursor,
  ],
  debugLevel: 1, // Verbosity level (1 - 5) when debug is set to true
};

const connectionOptions = {
  host: "127.0.0.1", // VNC Server
  // password: "", // Password
  set8BitColor: false, // If set to true, client will request 8 bit color, only supported with Raw encoding
  port: 8001, // Remote server port
};

const client = new VncClient(initOptions);

const addConndection = (socket) => {
  try {
    client.connect(connectionOptions);
    console.log(client._connected);
    // setInterval(() => {
    //   if (!client.connected) client.connect(connectionOptions);
    // }, 1000);

    client.on("connected", () => {
      console.log("Client connected.");
    });

    client.on("error", (err) =>
      console.log(`Client Connection error => ${err.message}`)
    );

    // Connection timed out
    client.on("connectTimeout", () => {
      console.log("Connection timeout.");
    });

    // Client successfully authenticated
    client.on("authenticated", () => {
      console.log("Client authenticated.");
    });

    // Authentication error
    client.on("authError", () => {
      console.log("Client authentication error.");
    });

    // Bell received from server
    client.on("bell", () => {
      console.log("Bell received");
    });

    // Client disconnected
    client.on("disconnect", () => {
      console.log("Client disconnected.");
      process.exit();
    });

    // Client disconnected
    client.on("close", () => {
      console.log("Client disconnected.");
      process.exit();
    });

    // Clipboard event on server
    client.on("cutText", (text) => {
      console.log("clipboard text received: " + text);
    });

    // Frame buffer updated
    client.on("firstFrameUpdate", (fb) => {
      console.log("First Framebuffer update received.");
    });

    // Frame buffer updated
    client.on("rect", (fb) => {
      console.log("rect received.");
    });

    // Frame buffer updated
    let imageBuffer = "hello";
    client.on("frameUpdated", (fb) => {
      console.log("Framebuffer updated.");
      new Jimp(
        {
          width: client.clientWidth,
          height: client.clientHeight,
          data: client.getFb(),
        },
        async (err, image) => {
          if (err) {
            console.log(`Image Error: ${err.message}`);
          }

          imageBuffer = await image.getBase64Async(Jimp.MIME_JPEG);
          socket.emit("screen-data", imageBuffer);
        }
      );
    });

    // Color map updated (8 bit color only)
    client.on("colorMapUpdated", (colorMap) => {
      console.log("Color map updated. Colors: " + colorMap.length);
    });

    // Rect processed
    client.on("rectProcessed", (rect) => {
      console.log("rect processed");
    });

    client.changeFps(10);
  } catch (error) {
    console.log(`Error in client connection: ${error}`);
  }
};

module.exports = { addConndection, client };
