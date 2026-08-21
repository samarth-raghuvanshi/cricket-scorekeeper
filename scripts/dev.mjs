import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const spawnOptions = { stdio: "inherit" };
const runNpm = (args) =>
  process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", npmCommand, ...args], spawnOptions)
    : spawn(npmCommand, args, spawnOptions);
const processes = [
  runNpm(["run", "api"]),
  runNpm(["run", "dev", "--prefix", "web"]),
];

let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) child.kill();
};

for (const child of processes) {
  child.on("exit", (code) => {
    if (!shuttingDown && code !== 0) {
      shutdown();
      process.exitCode = code ?? 1;
    }
  });
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", shutdown);