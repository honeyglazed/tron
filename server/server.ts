import { createServer } from "http";
import { Server, Socket} from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket: Socket) => {
    io.emit("init", "Hello World 2");
});
httpServer.listen(3000, '127.0.0.1', () => { console.log('server started')});