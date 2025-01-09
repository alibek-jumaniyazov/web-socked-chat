const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
    socket.on("chet messange", (msg) => {
        io.emit("chet messange", msg)
    })
})

http.listen(3000 , () => {
    console.log("3000 true");
})