const lines = [];
let pendingWrite = Promise.resolve();

export function createHandDiagnostics(game, sessionId) {
  return (message, error) => {
    const line = `${new Date().toISOString()} [${sessionId}] ${message}` +
      (error ? ` ${error.message || error}` : "");
    console[error ? "warn" : "info"](`梦三手牌 UI：${line}`);
    lines.push(line);
    if (lines.length > 100) lines.shift();
    if (typeof game?.writeFile !== "function") return;
    const contents = lines.join("\n") + "\n";
    pendingWrite = pendingWrite.then(() => game.promises.writeFile(
      contents, "extension/术樱包/mengsan/logs", "log.txt"
    )).catch(cause => console.warn("梦三手牌 UI 日志写入失败", cause));
  };
}
