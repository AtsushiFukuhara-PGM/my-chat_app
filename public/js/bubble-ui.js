// bubble-ui.js

import { updateUserListEntry } from "./chat-ui.js";

export async function setupBubbleSelector(){
    const openBtn=document.getElementById("add-bubble-btn");
    const modal=document.getElementById("bubble-modal");
    const closeBtn=document.getElementById("close-bubble-modal");
    const bubblelist=document.getElementById("bubble-list");
    
    // データ取得
    const res=await fetch("/bubbles");
    const bubbles=await res.json();

    bubblelist.innerHTML="";
    bubbles.forEach(file=>{
        const img=document.createElement("img");
        img.src=`images/bubbles/${file}`;
        img.className="bubble-thumb";
        img.dataset.filename=file;
        bubblelist.appendChild(img);
    });

    openBtn.addEventListener("click",()=>{
        modal.classList.add("show","animate-fade-in");
        modal.classList.remove("animate-fade-out");
    });

    // モーダルを閉じる共通関数
    function closeModal(){
        modal.classList.remove("animate-fade-in");
        modal.classList.add("animate-fade-out");
        setTimeout(()=>{
            modal.classList.remove("show","animate-fade-out");
        },400);
    }

    closeBtn.addEventListener("click",closeModal);
    window.addEventListener("click",(e)=>{
        if(e.target===modal)closeModal();
    });
}

export function setupBubbleEditor(){
    const modal=document.getElementById("bubble-modal");
    const bubblelist=document.getElementById("bubble-list");
    const editor=document.getElementById("bubble-editor");
    const preview=document.getElementById("bubble-preview");
    const previewText=document.getElementById("bubble-preview-text");
    const textInput=document.getElementById("bubble-text");
    const fontSize=document.getElementById("bubble-font-size");
    const fontColor=document.getElementById("bubble-font-color");
    const confirmBtn=document.getElementById("bubble-confirm");
    const backBtn=document.getElementById("bubble-back");
    const userListSidebar=document.getElementById("user-list-sidebar");

    // フォントサイズとカラーの初期値設定
    previewText.style.fontSize=fontSize.value+"px";
    previewText.style.color=fontColor.value;

    let selectedImage=null;

    // 吹き出しクリック時にエディタ起動
    bubblelist.addEventListener("click",(e)=>{
        const img=e.target.closest(".bubble-thumb");
        if(!img)return;
        selectedImage=img.dataset.filename;
        preview.src=`images/bubbles/${selectedImage}`;
        editor.style.display="block";
        bubblelist.style.display="none";

        modal.querySelector("h2").style.display="none";
    });

    // 戻るボタンの処理
    backBtn.addEventListener("click",()=>{
        editor.style.display="none";
        bubblelist.style.display="flex";
        selectedImage=null;
        modal.querySelector("h2").style.display="block";
    });

    // 入力文字プレビュー
    textInput.addEventListener("input",()=>{
        previewText.textContent=textInput.value||"文字を入力";
    });

    // サイズ・色変更で即反映
    fontSize.addEventListener("input",()=>{
        previewText.style.fontSize=fontSize.value+"px";
    });
    fontColor.addEventListener("change",()=>{
        previewText.style.color=fontColor.value;
    });

    // 確定クリック時
    confirmBtn.addEventListener("click",()=>{
        const target=window.getCurrentTarget?.();
        if(!target){
            alert("相手を選択してください");
            return;
        }
        const text=textInput.value.trim();
        if(!text){
            alert("文字を入力してください");
            return;
        }

        // 参照
        const socket=window.activeSocket;
        const userRef=window.activeUserRef;
        const chatBox=document.querySelector(".chat-box");

        if(!socket||!userRef){
            alert("接続情報が見つかりません");
            return;
        }

        const data={
            fromId:userRef.value.id,
            toId:target.id,
            image:selectedImage,
            text,
            fontSize:fontSize.value,
            color:fontColor.value,
            fromName:userRef.value.username
        };

        // サーバー送信
        socket.emit("bubbleMessage",data);

        // 自分側に即描画
        appendBubble(chatBox,userRef.value.username,
            selectedImage,text,true,fontSize.value,fontColor.value);

            updateUserListEntry(userListSidebar,target.id,text||"💬吹き出し")

        // UIリセット
        textInput.value="";
        editor.style.display="none";
        bubblelist.style.display="flex";

        // モーダルを閉じる
        modal.classList.remove("animate-fade-in");
        modal.classList.add("animate-fade-out");
        setTimeout(()=>{
            modal.classList.remove("show","animate-fade-out");
        },400);
    });
}

// 吹き出し描画関数
export function appendBubble(chatBox,user,image,text,isSelf,fontSize,color){
    const div=document.createElement("div");
    div.classList.add("message-block");
    div.classList.toggle("self",isSelf);
    // 相手の時だけ画像反転クラス付与
    const flippedClass=isSelf?"":"flipped";
    div.innerHTML=`
    <div class="meta-top">
      <span class="msg-user">${user}</span>
    </div>
    <div class="message-row">
      <div class="message-body">
        <div class="bubble-wrapper ${flippedClass}">
          <img src="images/bubbles/${image}" class="bubble-img">
          <div class="bubble-text" style="font-size:${fontSize}px; color:${color};">${text}</div>
        </div>
      </div>
      <span class="msg-time">${new Date().toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}</span>
    </div>
    ${isSelf ? `<div class="meta-bottom"><span class="msg-read">送信</span></div>` : ""}
    `;
    chatBox.appendChild(div);
    chatBox.scrollTop=chatBox.scrollHeight;
}