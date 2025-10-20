// main.js

import{setupChat}from"./chat.js";
import { setupProfileUI } from "./profile.js";

const userListDiv=document.getElementById("user-list");
const loginScreen=document.getElementById("login-screen");
const chatScreen=document.getElementById("chat-screen");
const registerBtn=document.getElementById("register-btn");
const newUserInput=document.getElementById("new-username");

async function loadUsers(){
    userListDiv.innerHTML="";
    const res=await fetch("/users")
    const users=await res.json();

    
    users.forEach(u=>{
        const btn=document.createElement("button");
        btn.textContent=u.username;
        btn.classList.add("user-btn");
        btn.dataset.userid=u.id;
        btn.dataset.username=u.username;

        // 選択ユーザーにアクティブ付与
        btn.addEventListener("click",()=>{
            document.querySelectorAll(".user-btn").forEach(b=>b.classList.remove("active"));
            btn.classList.add("active");
            login(u.id,u.username);
        });
        userListDiv.appendChild(btn);
    });
}

loadUsers();

// 新規登録
registerBtn.addEventListener("click",async()=>{
    const name=newUserInput.value.trim();
    if(!name)return alert("名前を入力してください");

    const res=await fetch("/register",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username:name})
    });
    const data=await res.json();

    if(data.success){
        alert("登録しました");
        newUserInput.value="";
        loadUsers();
    }else{
        alert("登録に失敗しました");
    }
});

// ログイン処理
function login(userId,username){
    const socket=io({auth:{id:userId,username}});
    socket.on("connect",()=>{
        console.log(`✅connected as ${username}(id:${userId})`);
        loginScreen.style.display="none";
        chatScreen.style.display="flex";
        // チャットとプロフィールUI初期化
        setupChat(socket,{id:userId,username});
        setupProfileUI({id:userId,username},socket);

        // 右上にログインモーダル表示
        showFloatingUserInfo(username);
    });
    socket.on("connect_error",(err)=>{
        console.error("✖connection error:",err);
        alert("サーバーに接続できません");
    });
}

// ログアウト（ページリロード）処理
document.getElementById("logout-btn").addEventListener("click",()=>{
    if(confirm("ログアウトしますか？")){
        location.reload();
    }
});

// ログイン状態モーダル関数
function showFloatingUserInfo(username){
    // 既にある場合は更新のみ
    const info=document.getElementById("user-floating-info");
    const nameElement=document.getElementById("floating-username");
    const statusElement=document.querySelector(".floating-status");
    const logoutBtn=document.getElementById("logout-btn");

    if(!info)return;

    // 表示＆更新
    info.classList.add("show");
    if(nameElement)nameElement.textContent=username;
    if(statusElement)statusElement.textContent="ログイン中";

    // ログイン時にのみログアウトボタン表示
    if(logoutBtn)logoutBtn.style.display="block";
}

import { setupBubbleEditor, setupBubbleSelector } from "./bubble-ui.js";

// チャット画面が開いた後にモーダル起動
window.addEventListener("DOMContentLoaded",()=>{
    setTimeout(()=>{
        setupBubbleSelector();
        setupBubbleEditor();
    },1000);
});