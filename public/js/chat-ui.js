// chat-ui.js

// メッセージを画面に追加
export function appendMessage(chatBox,user,text,isSelf,time,isRead){
    const div=document.createElement("div");
    div.classList.add("message-block");
    if(isSelf)div.classList.add("self");

    div.innerHTML=`
    <div class="meta-top">
      <span class="msg-user">${user}</span>
    </div>
    <div class="message-row">
      <div class="message-body">
        <div class="msg-text">${text}</div>
      </div>
      <span class="msg-time">${formatTime(time)}</span>
    </div>
    ${isSelf ? `<div class="meta-bottom"><span class="msg-read">${isRead ? "既読" : "未読"}</span></div>` : ""}
    `;

    // 自動スクロール
    chatBox.appendChild(div);
    chatBox.scrollTop=chatBox.scrollHeight;
}

// 特定のユーザーのリスト情報だけ更新
export function updateUserListEntry(userListSidebar,targetId,lastMsgText){
    const btn=userListSidebar.querySelector(`.chat-user-btn[data-userid="${targetId}"]`);
    if(!btn)return;

    const lastMsgEl=btn.querySelector(".last-msg");
    const lastTimeEl=btn.querySelector(".last-time");
    if(lastMsgEl)lastMsgEl.textContent=lastMsgText;
    if(lastTimeEl){
        lastTimeEl.textContent=new Date().toLocaleTimeString("ja-JP",{
            hour:"2-digit",
            minute:"2-digit",
        });
    }
}

// 時刻フォーマット
export function formatTime(t){
    if(!t)return"";
    let d;
    if(t instanceof Date){
        d=t;
    }else if(typeof t==="number"){
        d=new Date(t);
    }else if(typeof t==="string"){
        // MySQL "YYYY-MM-DD HH:MM:SS" -> ISO
        const s=t.includes(" ")?t.replace(" ","T"):t;
        d=new Date(s);
        // もしローカル表記 "YYYY/MM/DD HH:MM:SS" が来ても潰す
        if(isNaN(d)&&t.includes("/")){
            const [datePart, timePart="00:00:00"] = t.split(" ");
            const [Y,M,D] = datePart.split("/");
            d = new Date(`${Y}-${M.padStart(2,"0")}-${D.padStart(2,"0")}T${timePart}`);
        }
    }
    if(isNaN(d))return "";
    const h=String(d.getHours()).padStart(2,"0");
    const m=String(d.getMinutes()).padStart(2,"0");
    return `${h}:${m}`;
}