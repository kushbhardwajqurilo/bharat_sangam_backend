module.exports = {
  apps: [
    {
      name: "api",
      script: "index.mjs",
      instances: 1, // uses all CPU cores
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "worker",
      script: "src/workers/ticket.workers.mjs",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
