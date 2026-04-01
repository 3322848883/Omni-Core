module.exports = {
  apps: [{
    name: 'omnicore-admin-api',
    script: '/omni-core/apps/admin-api/start.sh',
    interpreter: 'bash',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3005,
      HOST: '0.0.0.0',
      CORS_ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:3000,http://localhost:8081,http://localhost:8082',
      IPDATA_API_KEY: 'a3ca0631918fd0bc54433c969399eb6df23cca1e67a40eee2f759cd8'
    },
    log_file: '/var/log/omnicore/admin-api-combined.log',
    out_file: '/var/log/omnicore/admin-api-out.log',
    error_file: '/var/log/omnicore/admin-api-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    listen_timeout: 10000
  }]
};
