const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 模擬資料庫 (初始資料)
let users = [
    { id: 1, name: "DuDu Lin", email: "Jenny@test.com" },
    { id: 2, name: "Xu3 Li", email: "Pheobe@test.com" },
	{ id: 3, name: "Chiu Chiu", email: "Yiyi@test.com" },
	{ id: 4, name: "CY ouo", email: "Joy@test.com" },
	{ id: 5, name: "dd prince", email: "Yee@test.com" },
];

// --- Bug 開關 ---
const TRIGGER_BUG = false; 
// ----------------

// 1. 登入 (POST)
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username=="admin1" && password=="password0123") {
        res.json({ message: "Login successful", token: "token-0988438335" });
    } else {
        res.status(400).json({ error: "Missing credentials" });
    }
});

// 中間件: 檢查 Token
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== "token-0988438335") {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};

// head 必須在 get 前才不會被get阻攔
// 2. 檢查資源資訊，只回傳 header 不回傳 body (HEAD)
app.head('/users', authenticate, (req, res) => {
    // 設定 Response Header 給客戶端看
    res.set('Content-Type', 'application/json');
    res.set('X-Server-Message', 'Hello from HEAD method'); // 自定義 Header
    
    // HEAD 請求不能回傳 Body，所以用 .end() 結束
    res.status(200).end(); 
});

// 3. 查詢列表 (GET) - 這裡有 BUG 開關
app.get('/users', authenticate, (req, res) => {
    if (TRIGGER_BUG) {
        //變數更改
        const buggyUsers = users.map(u => ({
            user_id: u.id,
            name: u.name,
            email: u.email
        }));
		res.status(500).json(buggyUsers);
    } else {
        res.json(users);
    }
});

// 4. 修改使用者 (PUT)
app.put('/users/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    res.json(user);
});

// 5. 部分修改使用者 (PATCH)
app.patch('/users/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    
    res.json(user);
});

// 6. 刪除使用者 (DELETE)
app.delete('/users/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = users.length;
    users = users.filter(u => u.id !== id);
    // 找不到 ID 導致刪除失敗
    if (users.length === initialLength) {
        return res.status(404).json({ error: "User not found" });
    }
    // 204 No Content 代表成功刪除，不用回傳
    res.status(204).send(); 
});


// 7. 新增使用者 (POST)
app.post('/users', authenticate, (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
    }
    let newId = 1;
    while (users.find(u => u.id === newId)) {
        newId++;
    }
    const newUser = {
        id: newId,
        name: name,
        email: email
    };
    users.push(newUser);
    users.sort((a, b) => a.id - b.id);
    res.status(201).json(newUser);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`測試伺服器運行中: http://localhost:${PORT}`);
    console.log(`目前 Bug 狀態: ${TRIGGER_BUG ? "開啟 (會報錯)" : "關閉 (正常)"}`);
});