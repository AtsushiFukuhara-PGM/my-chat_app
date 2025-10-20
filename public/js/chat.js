// chat.js

import { appendBubble } from "./bubble-ui.js";
import{registerSocketHandlers}from"./chat-socket.js"
import{appendMessage,updateUserListEntry,formatTime}from"./chat-ui.js"

// チャット処理
export function setupChat(socket,user){
    let userRef={value:user};
    socket.removeAllListeners("chatMessage");
    socket.removeAllListeners("newMessageNotice");
    socket.removeAllListeners("messagesRead");

    const msgInput=document.getElementById("msg");
    const sendBtn=document.getElementById("send");
    const chatBox=document.querySelector(".chat-box");
    const chatWithLabel=document.getElementById("chat-with");
    const userListSidebar=document.getElementById("user-list-sidebar");
    const chatArea=document.querySelector(".chat-area");

    let currentTarget=null;
    const getCurrentTarget=()=>currentTarget;

    // ソケット受信イベント登録
    registerSocketHandlers(socket,userRef,{
        userListSidebar,
        chatBox,
        getCurrentTarget,
    });

    window.getCurrentTarget = getCurrentTarget;
    window.activeUserRef = userRef;
    window.activeSocket = socket;

    // ユーザー一覧を表示（自分以外）
    async function renderUserList(){
        const res=await fetch(`/user-stats?userId=${userRef.value.id}`);
        const users=await res.json();

        userListSidebar.innerHTML="";

        // いったん全削除
        await new Promise(r=>requestAnimationFrame(r));

        users.forEach(u=>{
            if(u.id===userRef.value.id)return;
            const btn=document.createElement("button");
            btn.classList.add("chat-user-btn");
            btn.dataset.userid=u.id;
            btn.dataset.username=u.username;
            btn.innerHTML=`
            <div class="user-main">
            <span class="user-name">${u.username}</span>
            <span class="last-time">${u.last_time||""}</span>
            </div>
            <div class="user-sub">
            <span class="last-msg">${u.last_message||"　"}</span>
            ${u.unread_count > 0 ? `<span class="badge">${u.unread_count}</span>`:""}
            </div>
            `;
            userListSidebar.appendChild(btn);
        });
    }

    // グローバル参照できるように一応windowへ
    window.renderUserList=renderUserList;

    // 初期描画
    renderUserList();

    // 相手をクリックしてチャットを開く
    userListSidebar.addEventListener("click",(e)=>{
        const btn=e.target.closest(".chat-user-btn");
        if(!btn)return;

        // 話している相手のクラスにアクティブ付与
        document.querySelectorAll(".chat-user-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");

        const targetId=Number(btn.dataset.userid);
        const targetName=btn.dataset.username;
        currentTarget={id:targetId,username:targetName};
        window.currentTarget=currentTarget;

        chatWithLabel.textContent=`相手：${targetName}`;
        chatBox.innerHTML="";

        // チャットエリア表示
        chatArea.classList.add("active");

        // 通知バッジ削除
        const badge=btn.querySelector(".badge");
        if(badge)badge.remove();

        // サーバーにルーム参加を通知
        socket.emit("joinRoom",{fromId:userRef.value.id,toId:targetId});

        // チャットを開いた瞬間に既読処理を送る
        socket.emit("readMessages",{fromId:targetId,toId:userRef.value.id});

        // 過去メッセージを取得
        fetch(`/messages?user1=${userRef.value.id}&user2=${targetId}`)
        .then((res)=>res.json())
        .then((messages)=>{
            messages.forEach(m=>{
                if(m.type==='bubble'){
                    try{
                        const bubbleData=JSON.parse(m.message);
                        appendBubble(
                            chatBox,
                            m.sender,
                            bubbleData.image,
                            bubbleData.text,
                            m.user_id === userRef.value.id,
                            bubbleData.fontSize,
                            bubbleData.color
                        );
                        }catch(err){
                            console.error("バブルJSON解析失敗：",err,m.message);
                        }
                    }else{
                        appendMessage(
                            chatBox,
                            m.sender,
                            m.message,
                            m.user_id===userRef.value.id,
                            m.created_at,
                            m.is_read
                        );
                    }
            });
        });
    });

    // 送信処理
    function sendMessage(){
        const text=msgInput.value.trim();
        if(!text)return;
        if(!currentTarget)return alert("相手を選択してください");

        const now=new Date().toISOString();

        // サーバーへ送信
        socket.emit("chatMessage",{
            fromId:userRef.value.id,
            text,
            toId:currentTarget.id,
            fromName:userRef.value.username
        });

        // 自分の画面にも即表示
        appendMessage(chatBox,userRef.value.username,text,true,now,false);

        // 送信時に自分のリストを更新
        updateUserListEntry(userListSidebar,currentTarget.id,text);

        msgInput.value="";
        msgInput.style.height="36px";
    }

    // 送信ボタンが押された時
    sendBtn.addEventListener("click",sendMessage);

    // Ctrl+Enterで送信、Enterのみで改行
    msgInput.addEventListener("keydown",(e)=>{
        if(e.key==="Enter"&&e.ctrlKey){
            e.preventDefault();
            sendMessage();
        }
    });

    // テキストエリアの高さを自動調整
    msgInput.addEventListener("input",()=>{
        msgInput.style.height="auto";
        msgInput.style.height=Math.min(msgInput.scrollHeight,150)+"px";
    });

    // 名前変更成功でクライアント側の変数とUIを更新
    socket.on("usernameUpdated",({success,newName})=>{
        if(success){
            console.log(`🆙 Username updated to${newName}`);
            userRef.value.username=newName;
            socket.auth.username=newName;
            const nameEl=document.getElementById("current-name");
            if(nameEl)nameEl.textContent=newName;
        }
    });

    // 他ユーザーの名前変更通知でリスト再描画
    socket.on("userListChanged",async()=>{
        console.log("🔁 User list updated from server");
        if(typeof renderUserList==="function")await renderUserList();
    });
}