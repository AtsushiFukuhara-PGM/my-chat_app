---
# 💬 My Chat App

リアルタイムチャットアプリです。  
**Node.js + Express + Socket.io + MySQL** を用いて構築されており、  
ユーザー登録・メッセージ送受信・吹き出しメッセージ・既読管理・プロフィール編集などの機能を備えています。

---

## 🚀 主な特徴

- **リアルタイム通信**：Socket.ioによる即時メッセージ送受信  
- **シンプルなログイン**：ユーザー名だけで登録・選択  
- **吹き出しメッセージ機能**：画像＋テキストを組み合わせたメッセージ送信  
- **未読・既読管理**：自動的に既読処理を反映  
- **プロフィール編集**：名前変更をリアルタイム反映  
- **軽量構成**：フレームワーク依存を最小限に、JSとCSSのみでUIを構築  

---

## 🏗️ 使用技術

| 分野 | 技術 |
|------|------|
| フロントエンド | HTML / CSS / Vanilla JavaScript (ES Modules) |
| バックエンド | Node.js / Express / Socket.io |
| データベース | MySQL (mysql2/promise) |
| その他 | REST API + WebSocket のハイブリッド構成 |

---

## 📂 ディレクトリ構成

```bash
my-chat-app/
├─ server.js              # サーバーエントリポイント
├─ api.js                 # REST API（ユーザー登録・一覧・最新メッセージなど）
├─ socket.js              # Socket.ioイベント処理
├─ db.js                  # MySQL接続プール
├─ public/
│  ├─ index.html          # 画面構成（ログイン・チャット・モーダルなど）
│  ├─ images/
│  │   └─ bubbles/        # 吹き出し画像群
│  ├─ css/
│  │   ├─ style.css
│  │   ├─ chat-main.css
│  │   ├─ chat-message.css
│  │   ├─ chat-bubble.css
│  │   ├─ profile.css
│  │   ├─ floating-modal.css
│  │   ├─ animation.css
│  │   ├─ modal.css
│  │   └─ login.css
│  └─ js/
│      ├─ main.js
│      ├─ chat.js
│      ├─ chat-socket.js
│      ├─ chat-ui.js
│      ├─ bubble-ui.js
│      └─ profile.js
└─ package.json
````

---

## ⚙️ セットアップ手順

### 1️⃣ 環境準備

以下がインストールされていることを確認してください：

* [Node.js (v18 以上推奨)](https://nodejs.org/)
* [MySQL (8.x 推奨)](https://www.mysql.com/)

---

### 2️⃣ プロジェクトのセットアップ

```bash
# クローン
git clone https://github.com/あなたのユーザー名/my-chat-app.git
cd my-chat-app

# 依存パッケージのインストール
npm install express socket.io mysql2
```

---

### 3️⃣ データベースの作成

MySQLにログインし、下記SQLを実行します：

```sql
CREATE DATABASE my_chat_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE my_chat_app;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) DEFAULT ''
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  to_user_id INT NOT NULL,
  message TEXT,
  type ENUM('text','bubble') DEFAULT 'text',
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

### 4️⃣ DB設定ファイルの確認（`db.js`）

```js
export const pool = mysql.createPool({
  host: "localhost",
  user: "root",        // ← MySQLのユーザー名
  password: "",        // ← パスワード（必要に応じて変更）
  database: "my_chat_app",
});
```

必要に応じて環境に合わせて変更してください。

---

### 5️⃣ サーバー起動

```bash
node server.js
```

実行後、ターミナルに下記のような表示が出れば成功です：

```
✅ サーバー起動：http://localhost:3000
```

---

## 💻 使い方

1. ブラウザで [http://localhost:3000](http://localhost:3000) を開く
2. 既存ユーザーをクリック、または新規ユーザー名を入力して登録
3. 他ブラウザや別タブで別ユーザーとしてログイン
4. ユーザー一覧から相手を選択してチャット開始
5. 「💬吹き出し追加」ボタンから画像付きメッセージを送信可能

---

## 📡 主な通信仕様

### REST API

| メソッド                          | エンドポイント              | 説明 |
| ----------------------------- | -------------------- | -- |
| `GET /users`                  | 登録ユーザー一覧を取得          |    |
| `POST /register`              | 新規ユーザー登録             |    |
| `GET /messages?user1=&user2=` | 双方のメッセージ履歴取得         |    |
| `GET /bubbles`                | 吹き出し画像一覧を取得          |    |
| `POST /update-username`       | ユーザー名変更              |    |
| `GET /user-stats?userId=`     | 各ユーザーの最新メッセージ・未読数を取得 |    |

---

### Socket.io イベント

| イベント名              | 方向            | 概要                |
| ------------------ | ------------- | ----------------- |
| `chatMessage`      | 双方向           | 通常メッセージ送受信        |
| `bubbleMessage`    | 双方向           | 吹き出しメッセージ送受信      |
| `readMessages`     | クライアント → サーバー | 既読更新通知            |
| `messagesRead`     | サーバー → クライアント | 既読完了通知            |
| `usernameChanged`  | クライアント → サーバー | 名前変更通知            |
| `userListChanged`  | サーバー → クライアント | 他ユーザー名変更反映        |
| `newMessageNotice` | サーバー → クライアント | 相手が別ルームにいる場合の新着通知 |

---

## 🎨 スクリーン概要

* **ログイン画面**：ユーザー選択と新規登録
* **チャット画面**：左にユーザーリスト、右にトークエリア
* **吹き出しモーダル**：画像選択＋文字入力でカスタム送信
* **プロフィールモーダル**：ユーザー名編集・保存
* **右上フローティング情報**：ログイン中ユーザーを常時表示

---

## 📘 今後の改善候補

* パスワード認証・セッション管理の導入
* メッセージ削除・編集機能
* オフラインメッセージ通知
* Docker構成化・デプロイスクリプト追加

---

## 🧑‍💻 作者メモ

このプロジェクトは、**バックエンド・フロントエンド・データベースを一貫して構築できる**
フルスタック開発のデモを目的としています。
Node.js学習・Socket.ioの理解・リアルタイム通信の実装練習に最適です。

---

## 🪄 ライセンス

MIT License
© 2025 あなたの名前（または GitHubユーザー名）

---

`````

---
