// socket.js
// socket.on系

import {pool} from "./db.js";

const userSockets=new Map();

export async function setupChatHandlers(io,socket){
    const {id:userId,username}=socket.handshake.auth||{};
    const safeUser=username||"匿名";
    userSockets.set(userId, socket.id);
    console.log(`${safeUser}(id:${userId})connected`);

    // 初回参加時にユーザー登録
    try{
        await pool.query(
            "INSERT IGNORE INTO users (id, username, password) VALUES (?, ?, '')",
            [userId,safeUser]
        );
    }catch(err){
        console.error("DB接続エラー：",err);
    }

    socket.on("joinRoom",({fromId,toId})=>{
        const roomName=[fromId,toId].sort().join("_");

        // 既存のルームを全部抜けてから新しいルームに入る
        for(const room of socket.rooms){
            if(room!==socket.id)socket.leave(room);
        }
        socket.join(roomName);
        console.log(`${safeUser} joined room ${roomName}`);
    })

    // メッセージ受信
    socket.on("chatMessage",async(data)=>{
        const {fromId,toId,text,fromName}=data;
        console.log(`[chat] ${fromId} -> ${toId}`);

        // 相手が別ルームにいる場合でも個別に通知
        const targetSocketId=userSockets.get(toId);
        if(targetSocketId){
            // 相手がこのルームにいるかを判定
            const roomName=[fromId,toId].sort().join("_");
            const socketsInRoom=await io.in(roomName).fetchSockets();
            const isInRoom=socketsInRoom.some(s=>s.id===targetSocketId);

            io.to(targetSocketId).emit("chatMessage",{fromId,toId,text,fromName});

            // もし相手が今このルームにいない場合のみ通知を送る
            if(!isInRoom){
                io.to(targetSocketId).emit("newMessageNotice",{fromId,text});
                console.log(`[notice] send to ${toId}`);
            }
        }

        // DB保存
        await pool.query(`
            INSERT INTO messages (user_id, to_user_id, message, is_read,created_at)
            VALUES (?, ?, ?, 0, NOW())
            `,[fromId,toId,text]
        );
    });

    // 既読処理
    socket.on("readMessages",async({fromId,toId})=>{
        await pool.query(`
            UPDATE messages
            SET is_read =1
            WHERE
            user_id = ?
            AND to_user_id = ?
            AND is_read = 0
            `,[fromId,toId]);

            // 相手に既読通知を送る
            const targetSocketId=userSockets.get(fromId);
            const roomName=[fromId,toId].sort().join("_");

            if(targetSocketId)
                io.to(roomName).emit("messagesRead",{byId:toId});
            console.log(`[readNotice]user${toId}read messages from ${fromId}`);
    });

    // ユーザー名変更をリアルタイムに反映
    socket.on("usernameChanged",async({userId,newName})=>{
        try{
            // DB更新（保険）
            await pool.query(
                "UPDATE users SET username = ? WHERE id = ?",
                [newName,userId]
            );

            console.log(`[rename]id:${userId}->${newName}`);
            socket.handshake.auth.username=newName;

            // クライアントに通知
            socket.emit("usernameUpdated",{success:true,newName});
            // 他の全員へ「リスト更新」を通知
            socket.broadcast.emit("userListChanged",{userId,newName});
        }catch(err){
            console.error("ユーザー名変更エラー：",err);
            socket.emit("usernameUpdated",{success:false});
        }
    });

    // 切断処理
    socket.on("disconnect",()=>{
        userSockets.delete(userId);
        console.log(`${safeUser}(id:${userId})disconnected`);
    });

    // 吹き出し送信イベント
    socket.on("bubbleMessage",async(data)=>{
        const {fromId,toId,image,text,fontSize,color,fromName}=data;
        const targetSocketId=userSockets.get(toId);
        console.log(`[bubble]${fromId}->${toId}`);

        try{
            // 相手がこのルームにいるかを判定
            const roomName=[fromId,toId].sort().join("_");
            const socketsInRoom=await io.in(roomName).fetchSockets();
            const isInRoom=socketsInRoom.some(s=>s.id===targetSocketId);

            // 相手に転送
            if(targetSocketId){
                io.to(targetSocketId).emit("bubbleMessage",data);

                // もし相手が今このルームにいない場合のみ通知を送る
                if(!isInRoom){
                    io.to(targetSocketId).emit("newMessageNotice",{
                        fromId,
                        text:text||"💬吹き出し",
                    });
                    console.log(`[notice] bubble send to ${toId}`);
                }
            }

            // DB保存
            await pool.query(`
                INSERT INTO messages (user_id, to_user_id, message, type, is_read,created_at)
                VALUES (?, ?, ?, ?, 0, NOW())
                `,[fromId,toId,JSON.stringify({image,text,fontSize,color}),'bubble']
            );
        }catch(err){
            console.error("[bubble] DB保存エラー：",err);
        }
    });
}