// api.js
// post、get関連

import fs from "fs";
import path from "path";
import {pool} from "./db.js";

export function setupUserRoutes(app){
    console.log("📡 setupUserRoutes loaded");

    // メッセージバブル画像全取得
    app.get("/bubbles",(req,res)=>{
        const dir=path.join(process.cwd(),"public/images/bubbles");
        fs.readdir(dir,(err,files)=>{
            if(err)return res.status(500).json({error:"フォルダ取得失敗"});
            const pngs=files.filter(f=>/\.(png|jpg|jpeg|gif)$/i.test(f));
            res.json(pngs);
        });
    });

    // 新規ユーザー登録API
    app.post("/register",async(req,res)=>{
        const{username}=req.body;
        console.log("📥 register request:",req.body);
        if(!username)return res.status(400).json({error:"名前が必要です"});

        try{
            const[result]=await pool.query(
                "INSERT IGNORE INTO users (username, password) VALUES (?, '')",
                [username]
            );
            res.json({success:result.affectedRows>0});
        }catch(err){
            console.error(err);
            res.status(500).json({error:"DBエラー"});
        }
    });

    // ユーザー一覧取得
    app.get("/users",async(req,res)=>{
        console.log("📡 /users accessed");
        try{
            const[rows]=await pool.query("SELECT id,username FROM users ORDER BY id");
            res.json(rows);
        }catch(err){
            console.error(err);
            res.status(500).json({error:"DBエラー"});
        }
    });
    // ユーザーステータス取得
    app.get("/user-stats",async(req,res)=>{
        const{userId}=req.query;

        try{
            const[rows]=await pool.query(`
                SELECT
                    u.id,
                    u.username,
                    (
                    SELECT
                    CASE
                        WHEN m.type = 'bubble' THEN
                            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(m.message, '$.text')),'💬吹き出し')
                        ELSE
                            m.message
                        END
                    FROM messages AS m
                    WHERE
                        (
                        (m.user_id = u.id AND m.to_user_id = ?)
                        OR
                        (m.user_id = ? AND m.to_user_id = u.id)
                        )
                    ORDER BY m.id DESC
                    LIMIT 1
                    ) AS last_message,
                    (
                    SELECT DATE_FORMAT(m.created_at, '%H:%i')
                    FROM messages AS m
                    WHERE
                        (
                        (m.user_id = u.id AND m.to_user_id = ?)
                        OR
                        (m.user_id = ? AND m.to_user_id = u.id)
                        )
                    ORDER BY m.id DESC
                    LIMIT 1
                    ) AS last_time,
                    (
                    SELECT COUNT(*)
                    FROM messages AS m
                    WHERE
                        m.to_user_id = ?
                        AND m.user_id = u.id
                        AND m.is_read = 0
                    ) AS unread_count
                FROM users AS u
                WHERE u.id != ?
                ORDER BY u.id ASC
                `, [userId,userId,userId,userId,userId,userId]
            );

            res.json(rows);
        }catch(err){
            console.error(err);
            res.status(500).json({error:"DBエラー"});
        }
    });

    // メッセージ受信
    app.get("/messages",async(req,res)=>{
        const {user1,user2}=req.query;

        try{
            const[rows]=await pool.query(`
                SELECT
                m.id,
                u.username AS sender,
                t.username AS receiver,
                m.user_id,
                m.to_user_id,
                m.message,
                m.type,
                m.created_at,
                m.is_read
                FROM messages AS m
                JOIN users AS u ON m.user_id = u.id
                JOIN users AS t ON m.to_user_id = t.id
                WHERE
                (m.user_id = ? AND m.to_user_id = ?)
                OR
                (m.user_id = ? AND m.to_user_id = ?)
                ORDER BY m.id ASC
                `,
                [user1,user2,user2,user1]);

            res.json(rows);
        }catch(err){
            console.error(err);
            res.status(500).json({error:"DBエラー"});
        }
    });
    // ユーザー名更新
    app.post("/update-username",async(req,res)=>{
        const{userId,newName}=req.body;
        if(!userId||!newName)
            return res.status(400).json({error:"ユーザーIDまたは新しい名前が不足しています"});

        try{
            await pool.query(
                "UPDATE users SET username = ? WHERE id = ?",
                [newName,userId]
            );
            res.json({success:true});
        }catch(err){
            console.error(err);
            res.status(500).json({error:"DBエラー"});
        }
    });
}

