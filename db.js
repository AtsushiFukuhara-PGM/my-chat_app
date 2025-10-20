// db.jsの記述

import mysql from "mysql2/promise";

export const pool=mysql.createPool({
    host:"localhost",
    user:"root",
    password:"",
    database:"my-chat_app",
});