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
      // console.log(client.getFb());
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

    // client.requestFrameUpdate(false, 0, 0, 0, client.width, client.height);

    client.changeFps(10);
  } catch (error) {
    console.log(`Error in client connection: ${error}`);
  }
};

module.exports = { addConndection, client };

// const net = require("net");

// const vncServerAddress = "127.0.0.1";
// const vncServerPort = 8001; // Default VNC server port

// function readUInt32BE(buffer, offset) {
//   return buffer.readUInt32BE(0);
// }

// const addConndection = (socket) => {
//   try {
//     const client = new net.Socket();

//     client.on("connect", () => {
//       console.log("Connected to VNC server");

//       // Send the RFB protocol version handshake
//       const protocolVersion = "RFB 003.003\n";
//       client.write(protocolVersion);

//       // Handle incoming data
//       client.on("data", (data) => {
//         // Handle the RFB protocol responses here
//         console.log(
//           "Received data:",
//           data.toString("hex").match(/../g).join(" ")
//         );

//         // Parse the RFB protocol messages
//         const messageType = data[0];

//         switch (messageType) {
//           case 0: // FramebufferUpdate message
//             handleFramebufferUpdate(data);
//             break;
//           // Add more cases for other message types as needed
//           default:
//             console.log("Unhandled RFB protocol message type:", messageType);
//         }
//       });
//     });

//     function handleFramebufferUpdate(data) {
//       const numberOfRectangles = readUInt32BE(data, 4);
//       console.log(
//         "Number of rectangles in FramebufferUpdate:",
//         numberOfRectangles
//       );

//       // Each rectangle has its own information and pixel data
//       let offset = 8; // Start reading from offset 8

//       for (let i = 0; i < numberOfRectangles; i++) {
//         const xPosition = readUInt32BE(data, offset);
//         const yPosition = readUInt32BE(data, offset + 4);
//         const width = readUInt32BE(data, offset + 8);
//         const height = readUInt32BE(data, offset + 12);
//         const encodingType = readUInt32BE(data, offset + 16);

//         console.log(
//           `Rectangle ${
//             i + 1
//           }: x=${xPosition}, y=${yPosition}, width=${width}, height=${height}, encoding=${encodingType}`
//         );

//         // Parse pixel data based on encoding type
//         // Implement decoding logic for each encoding type as needed

//         offset += 20; // Move to the next rectangle
//       }
//     }

//     client.on("close", () => {
//       console.log("Connection to VNC server closed");
//     });

//     client.on("error", (err) => {
//       console.error("Error connecting to VNC server:", err);
//     });

//     // Connect to the VNC server
//     client.connect(vncServerPort, vncServerAddress);
//   } catch (error) {
//     console.log(`Error in client connection: ${error}`);
//   }
// };

// module.exports = { addConndection };

// const rfb = require("rfb2");

// const addConndection = (socket) => {
//   var r = rfb.createConnection({
//     host: "192.168.1.5",
//     port: 5900,
//     // password: "sokker999",
//   });

//   r.on("connect", function () {
//     console.log("successfully connected and authorised");
//     console.log(
//       "remote screen name: " +
//         r.title +
//         " width:" +
//         r.width +
//         " height: " +
//         r.height
//     );
//   });

//   r.on("error", function (error) {
//     console.log(error);
//     // throw new Error(error);
//   });

//   // r.pointerEvent(100, 100, 0); // x, y, button state (bit mask for each mouse button)
//   // r.keyEvent(40, 0); // keycode, is down?
//   // r.updateClipboard("send text to remote clipboard");

//   // screen updates
//   r.on("rect", function (rect) {
//     switch (rect.encoding) {
//       case rfb.encodings.raw:
//       // rect.x, rect.y, rect.width, rect.height, rect.data
//       // pixmap format is in r.bpp, r.depth, r.redMask, greenMask, blueMask, redShift, greenShift, blueShift
//       case rfb.encodings.copyRect:
//       // pseudo-rectangle
//       // copy rectangle from rect.src.x, rect.src.y, rect.width, rect.height, to rect.x, rect.y
//       case rfb.encodings.hextile:
//         // not fully implemented
//         rect.on("tile", handleHextileTile); // emitted for each subtile
//     }
//     r.requestUpdate(false, 0, 0, r.width, r.height); // incremental?, x, y, w, h
//   });

//   // Connection timed out
//   r.on("connectTimeout", () => {
//     console.log("Connection timeout.");
//   });

//   // Client successfully authenticated
//   r.on("authenticated", () => {
//     console.log("Client authenticated.");
//   });

//   // Authentication error
//   r.on("authError", () => {
//     console.log("Client authentication error.");
//   });

//   // Client disconnected
//   r.on("disconnect", () => {
//     console.log("Client disconnected.");
//     process.exit();
//   });

//   // Client disconnected
//   r.on("close", () => {
//     console.log("Client disconnected.");
//     process.exit();
//   });

//   // Clipboard event on server
//   r.on("cutText", (text) => {
//     console.log("clipboard text received: " + text);
//   });

//   // Frame buffer updated
//   r.on("firstFrameUpdate", (fb) => {
//     console.log("First Framebuffer update received.");
//   });

//   // Frame buffer updated
//   r.on("rect", (fb) => {
//     console.log("rect received.");
//   });

//   // Frame buffer updated
//   let imageBuffer = "hello";
//   r.on("frameUpdated", (fb) => {
//     console.log("Framebuffer updated.");
//     // console.log(client.getFb());
//     new Jimp(
//       {
//         width: client.clientWidth,
//         height: client.clientHeight,
//         data: client.getFb(),
//       },
//       async (err, image) => {
//         if (err) {
//           console.log(`Image Error: ${err.message}`);
//         }

//         imageBuffer = await image.getBase64Async(Jimp.MIME_JPEG);
//         socket.emit("screen-data", imageBuffer);
//       }
//     );
//   });

//   // Color map updated (8 bit color only)
//   r.on("colorMapUpdated", (colorMap) => {
//     console.log("Color map updated. Colors: " + colorMap.length);
//   });

//   // Rect processed
//   r.on("rectProcessed", (rect) => {
//     console.log("rect processed");
//   });

//   r.on("resize", function (rect) {
//     console.log(
//       "window size has been resized! Width: %s, Height: %s",
//       rect.width,
//       rect.height
//     );
//   });

//   r.on("clipboard", function (newPasteBufData) {
//     console.log("remote clipboard updated!", newPasteBufData);
//   });

//   r.on("bell", console.log.bind(null, "Bell!!"));

//   // force update
//   // updates are requested automatically after each new received update
//   // you may want to have more frequent updates for high latency / high bandwith connection
//   // r.requestUpdate(false, 0, 0, r.width, r.height); // incremental?, x, y, w, h

//   // r.end(); // close connection
// };

// module.exports = { addConndection };
