const firebaseConfig = {
  apiKey: "AIzaSyDWnkCkBPZl1aQMdgEP0n9CT8r4GqJuNGc",
  authDomain: "volleyballplayoff.firebaseapp.com",
  projectId: "volleyballplayoff",
  storageBucket: "volleyballplayoff.firebasestorage.app",
  messagingSenderId: "925852968173",
  appId: "1:925852968173:web:bfcee4a930bc8e0f9ad8e4",
  measurementId: "G-7Y2WV1K8H0"
};

// Super Admin 電子信箱清單（可加入多個）
// 這裡的人可以管理所有人的場次
const ADMIN_EMAILS = [
  "anc8038570@gmail.com",
  "joehuangyf@gmail.com",
];

export { firebaseConfig, ADMIN_EMAILS };
