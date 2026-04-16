module.exports = {
  apps: [
    {
      name: "api",
      script: "index.mjs",
      cwd: "/var/www/bharat_bhakti/bharat_sangam_backend",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 8001,
      },
    },
    {
      name: "worker",
      script: "src/workers/ticket.workers.mjs",
      cwd: "/var/www/bharat_bhakti/bharat_sangam_backend",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
