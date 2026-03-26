module.exports = {
  apps: [
    {
      name: "seotool-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // If using standalone output (recommended)
      // script: ".next/standalone/server.js",
      // cwd: "./", 
    }
  ]
};
