module.exports = {
  apps: [
    {
      name: "mylink",
      script: "npm",
      args: "run start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "34596"
      }
    }
  ]
};
