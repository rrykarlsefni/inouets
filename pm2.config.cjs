module.exports = {
  apps: [
    {
      name: "inouets",
      script: "npx",
      args: "ts-node --esm start/index.ts",
      watch: ["start", "handle", "command", "config"],
      ignore_watch: [
        "node_modules",
        "rrykarl_sessi",
        "tmp",
        ".cache"
      ],
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}