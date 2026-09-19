import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

if (!process.stdin.isTTY) {
  console.error("请在交互终端中运行 npm run admin:password。");
  process.exitCode = 1;
} else {
  console.log("设置后台密码（输入隐藏，至少 12 个字符；Ctrl+C 取消）：");
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let password = "";
  let first;
  function finish() {
    process.stdin.setRawMode(false);
    process.stdin.removeListener("keypress", onKey);
    process.stdin.pause();
  }
  function onKey(text, key = {}) {
    if (key.ctrl && key.name === "c") { finish(); process.exitCode = 130; return; }
    if (key.name === "return" || key.name === "enter") {
      if (password.length < 12 || password.length > 1024) {
        console.log("密码需为 12–1024 个字符，请重新输入：");
        password = "";
      } else if (first === undefined) {
        first = password;
        password = "";
        console.log("再次输入密码：");
      } else if (password !== first) {
        first = undefined;
        password = "";
        console.log("两次密码不一致，请重新输入：");
      } else {
        const salt = randomBytes(16);
        const hash = scryptSync(password, salt, 64);
        finish();
        console.log(`ADMIN_PASSWORD_HASH=${salt.toString("hex")}:${hash.toString("hex")}`);
      }
    } else if (key.name === "backspace") {
      password = Array.from(password).slice(0, -1).join("");
    } else if (!key.ctrl && !key.meta && text && !/[\x00-\x1f\x7f]/.test(text)) {
      password += text;
    }
  }
  process.stdin.on("keypress", onKey);
}
