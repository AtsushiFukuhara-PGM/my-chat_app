// profile.js

import { setupChat } from "./chat.js";

export function setupProfileUI(user,socket){
    const icon=document.getElementById("profile-icon");
    const modal=document.getElementById("profile-modal");
    const closeBtn=document.getElementById("close-modal");
    const currentName=document.getElementById("current-name");
    const editName=document.getElementById("edit-name");
    const renameIcon=document.getElementById("rename-icon");
    const saveBtn=document.getElementById("save-profile");

    if(!icon||!modal)return;

    // 初期表示
    currentName.textContent=user.username;
    editName.style.display="none";

    // アイコンクリックでモーダルを開く
    icon.addEventListener("click",()=>{
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

    // ×ボタンクリックでモーダルを閉じる
    closeBtn.addEventListener("click",closeModal);

    // モーダル背景クリックでも閉じる
    window.addEventListener("click",(e)=>{
        if(e.target.classList.contains("modal"))closeModal();
    });

    // リネームアイコンを押したら編集モード
    renameIcon.addEventListener("click",()=>{
        currentName.style.display="none";
        renameIcon.style.display="none";
        editName.style.display="block";
        editName.value=currentName.textContent;
        editName.focus();
    });

    // 保存ボタンクリックで通信
    saveBtn.addEventListener("click",async()=>{
        const newName=editName.value.trim();
        const oldName=currentName.textContent;
        if(!newName||newName===currentName.textContent){
            modal.style.display="none";
            return;
        }

        try{
            // DB更新
        const res=await fetch("/update-username",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({userId:user.id,newName})
        });

        const data=await res.json();

        if(data.success){
            // UI更新
            currentName.textContent=newName;
            editName.style.display="none";
            renameIcon.style.display="inline";
            currentName.style.display="inline";
            modal.style.display="none";
            // ソケットにも通知
            socket.emit("usernameChanged",{userId:user.id,newName});

            alert("名前を更新しました。ページをリロードします");
            location.reload();
        }else{
            alert("更新に失敗しました")
        }
        }catch(err){
        console.error(err);
        alert("通信エラー");
        }
    });
}