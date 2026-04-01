module.exports = {
  apps: [{
    name: 'omnicore-client-api',
    script: '/omni-core/apps/client-api/start.sh',
    interpreter: 'bash',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3101,
      HOST: '0.0.0.0'
    },
    log_file: '/var/log/omnicore/client-api-combined.log',
    out_file: '/var/log/omnicore/client-api-out.log',
    error_file: '/var/log/omnicore/client-api-error.log',
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
