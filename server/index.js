require('dotenv').config()
const http = require("http");
const SpotifyWebApi = require("spotify-web-api-node");
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const lyricsFinder = require("lyrics-finder")

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI

const APP_PORT=process.env.APP_PORT;
const SERVER_PORT=process.env.SERVER_PORT;

// Serve frontend
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))
app.get('/lyrics', async(req,res) =>{
    const lyrics = await lyricsFinder(req.query.artist, req.query.track) || "No lyrics found :("
    res.json({ lyrics })
})
app.post('/refresh', (req, res) => {
    const refreshToken = req.body.refreshToken
    const spotifyApi = new SpotifyWebApi({
        redirectUri: REDIRECT_URI,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken
    })
    spotifyApi.refreshAccessToken().then(data => {
        console.log('The access token has been refreshed')
        // console.log(data.body)
        res.json({
            accessToken: data.body.access_token,
            expiresIn: data.body.expires_in
        })
        spotifyApi.setAccessToken(data.body['access_token']);
    }).catch(err => {
        // console.log(err)
        res.sendStatus(400)
    })
})
app.post('/login', (req, res) => {
    console.log("login endpoint hit")
    const code = req.body.code
    const spotifyApi = new SpotifyWebApi({
        redirectUri: REDIRECT_URI,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
    })
    spotifyApi.authorizationCodeGrant(code).then(data => {
        res.json({
            accessToken: data.body.access_token,
            refreshToken: data.body.refresh_token,
            expiresIn: data.body.expires_in
        })
    })
    .catch(err => {
        // console.log(err)
        res.sendStatus(400)
    })
})

app.listen(APP_PORT, () => console.log("Listening on ", APP_PORT))
// app.get("/", (req,res) => res.sendFile(__dirname + "/index.html"))
// app.listen(APP_PORT, () => console.log("Listening on http port", APP_PORT))





// Websocket stuff
const { v4: uuidv4 } = require('uuid');
const httpServer = http.createServer();
const io = require("socket.io")(httpServer, {
    transports: ["websocket", "polling"]
})

// States
const clients = {};
const rooms={};

httpServer.listen(SERVER_PORT, () => console.log("Listening on ", SERVER_PORT))
io.on("connection", client => {
    console.log("Connected: ", client.id)
    client.on("create", alias => {
        console.log("Create: ", client.id)
        const roomId = genId2(5);
        rooms[roomId] = {
            "id": roomId,
            "playing": "",
            "users": [],
            "state": "paused",
            "queue": []
        }
        const payLoad = {
            "room": rooms[roomId],
            "host": alias
        }
        io.in(client.id).emit("created", payLoad);
        console.log(payLoad)
    })
    client.on("join", req => {
        console.log("Join: ", req)
        const user = {
            name: req.name,
            id: client.id
        }
        
        rooms[req.roomId].users.push(user)
        clients[client.id] = req.roomId
        const payLoad = {
            "room": rooms[req.roomId],
        }
        client.join(req.roomId);
        io.in(client.id).emit("joined", payLoad);
        io.in(req.roomId).emit("newUser", user);
        io.in(req.roomId).emit("users", Object.values(rooms[req.roomId].users))
    })
    client.on("disconnect", () => {
        console.log("Disconnected: ", client.id)
        // const user = users[client.id]
        if(clients[client.id]){
            // delete user from user list
            io.in(clients[client.id]).emit("disconnected", client.id)
            const roomId = clients[client.id]
            const userIndex = rooms[roomId].users.findIndex(user => {
                return user.id === client.id;
            });
            rooms[roomId].users.splice(userIndex, 1) 
            io.in(roomId).emit("users", Object.values(rooms[roomId].users))
            delete clients[client.id]

            // check if we can clean up the room
            if(rooms[roomId].users.length == 0){
                console.log("Removing "+ roomId + ": no active users")
                delete rooms[roomId]
                console.log(rooms)
            }
        }
        
    })
})

function genId(length){
    return (Math.random().toString(36)+'00000000000000000').slice(2, length+2)
}

function genId2(length){
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}





//// Legacy websocket logic - now using socket.io!
// const websocketServer = require("websocket").server

// httpServer.listen(SERVER_PORT, () => console.log("Listening on ", SERVER_PORT))

// const wsServer = new websocketServer({
//     "httpServer": httpServer
// })

// wsServer.on("request", request => {
//     const connection = request.accept(null, request.origin);
//     connection.on("open", () => console.log("opened"))
//     connection.on("close", () => console.log("closed"))
//     connection.on("message", message => {
//         const result = JSON.parse(message.utf8Data)
//         console.log(result)
//         // Handle Payload methods
//         // Create
//         if(result.method === "create"){
//             const clientId = result.clientId;
//             const roomId = uuidv4();
//             rooms[roomId] = {
//                 "id": roomId,
//                 "playing": "testid",
//                 "clients": [],
//                 "state": "paused",
//                 "queue": []
//             }

//             const payLoad = {
//                 "method": "create",
//                 "room": rooms[roomId]
//             }

//             const con = clients[clientId].connection;
//             con.send(JSON.stringify(payLoad));
//         }
//         // Join
//         if(result.method === "join"){
//             const clientId = result.clientId;
//             const roomId = result.roomId
//             const room = rooms[roomId]
//             if(room.clients.length >= 5){
//                 console.log("Max clients reached");
//             }
//             room.clients.push({
//                 "clientId": clientId
//             })

//             const payLoad = {
//                 "method": "join",
//                 "room": rooms[roomId],
//                 "newUser": clientId
//             }
//             room.clients.forEach(c=> {
//                 clients[c.clientId].connection.send(JSON.stringify(payLoad))
//             })
//         }

//         // Add
//         if(result.method === "add"){
//             const clientId = result.clientId;
//             const songId = result.songId
//             const roomId = result.roomId
//             const room = rooms[roomId]

//             room.queue.push({
//                 "songId": songId
//             })

//             const payLoad = {
//                 "method": "add",
//                 "room": rooms[roomId],
//                 "result": result
//             }
//             room.clients.forEach(c=> {
//                 clients[c.clientId].connection.send(JSON.stringify(payLoad))
//             })
//         }

//         // Add
//         if(result.method === "play"){
//             const clientId = result.clientId;
//             const roomId = result.roomId
//             const room = rooms[roomId]

//             room.state = (room.state === "playing") ? "paused" : "playing"

//             const payLoad = {
//                 "method": "play",
//                 "room": rooms[roomId],
//                 "result": result
//             }
//             room.clients.forEach(c=> {
//                 clients[c.clientId].connection.send(JSON.stringify(payLoad))
//             })
//         }
//     })
//     const clientId = uuidv4();
//     console.log("Assigning clientId:", clientId)
//     clients[clientId]  = {
//         "connection": connection
//     }
//     const payLoad = {
//         "method": "connect",
//         "clientId": clientId
//     }
//     connection.send(JSON.stringify(payLoad))
// })