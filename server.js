// server.js

import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import {setupUserRoutes} from "./api.js";
import {setupChatHandlers} from "./socket.js";

const app=express();
const server=createServer(app);
const io=new Server(server);

app.use(express.json());
app.use(express.static("public"));

// API.js呼び出し
setupUserRoutes(app);

// Socket.js呼び出し
io.on("connection",(socket)=>setupChatHandlers(io,socket));

server.listen(3000,()=>{
    console.log("✅ サーバー起動：http://localhost:3000");
});