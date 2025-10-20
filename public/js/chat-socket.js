// chat-socket.js

import { appendBubble } from "./bubble-ui.js";
import{appendMessage,updateUserListEntry}from"./chat-ui.js";

export function registerSocketHandlers(socket,userRef,refs){
    const{userListSidebar,chatBox,getCurrentTarget}=refs;

    // 受信時（ほかの人からメッセージ）
    socket.on("chatMessage",(data)=>{
        const time=data.created_at||new Date().toISOString();
        // 自分が送受信者じゃないなら無視
        if(data.fromId!==userRef.value.id && data.toId!==userRef.value.id)return;
        // 開いてるチャットに一致
        const currentTarget=getCurrentTarget();
        if(data.fromId===currentTarget.id||data.toId===currentTarget.id){
            appendMessage(
                chatBox,
                data.fromName||`User${data.fromId}`,
                data.text,
                data.fromId===userRef.value.id,
                time,
                false);

            if(data.fromId===currentTarget.id&&data.toId===userRef.value.id){
                socket.emit("readMessages",{fromId:data.fromId,toId:userRef.value.id});
            }
        }

        // サイドバーに反映
        const otherId=data.fromId===userRef.value.id?data.toId:data.fromId;
        updateUserListEntry(userListSidebar,otherId,data.text);
    });

    // 新着通知
    socket.on("newMessageNotice",async(data)=>{
        const currentTarget=getCurrentTarget();
        if(currentTarget&&data.fromId===currentTarget.id)return;
        console.log("[notice]",data);
        // 未読バッジ+last_msg更新
        const btn=userListSidebar.querySelector(`.chat-user-btn[data-userid="${data.fromId}"]`);
        if(btn){
            let badge=btn.querySelector(".badge");
            if(!badge){
                badge=document.createElement("span");
                badge.className="badge";
                badge.textContent="1";
                btn.querySelector(".user-sub").appendChild(badge);
            }else{
                badge.textContent=(parseInt(badge.textContent)||0)+1;
            }
            updateUserListEntry(userListSidebar,data.fromId,data.text);
        }
    });

    // 既読通知
    socket.on("messagesRead",(data)=>{
        const currentTarget=getCurrentTarget();
        if(currentTarget&&data.byId===currentTarget.id){
            const unreadMarks=document.querySelectorAll(".msg-read");
            unreadMarks.forEach((el)=>(el.textContent="既読"));
            console.log(`[client]user${data.byId}read your messages`);
        }
    });

    // バブル受信
    socket.on("bubbleMessage",(data)=>{
        const {fromId,toId,image,text,fontSize,color,fromName}=data;
        const currentTarget=getCurrentTarget();
        if(!currentTarget)return;

        const isSelf=fromId===userRef.value.id;
        if(data.fromId===currentTarget.id||isSelf){
            appendBubble(chatBox,fromName,image,text,isSelf,fontSize,color);
        }

        const otherId=data.fromId===userRef.value.id?data.toId:data.fromId;
        updateUserListEntry(userListSidebar,otherId,text||"💬吹き出し");
    });
}