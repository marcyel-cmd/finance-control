// ecosystem.config.js — PM2 para PrevÊ Finance Control
// Uso: pm2 start ecosystem.config.js --env production
//      pm2 reload ecosystem.config.js --env production  (zero-downtime)

module.exports = {
  apps: [
    {
      name: 'finance-backend',
      script: 'dist/server.js',

      // Instâncias — use 'max' para usar todos os cores, ou um número fixo
      instances: 1,
      exec_mode: 'fork',   // mude para 'cluster' se instances > 1

      // Estabilidade
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,

      // Carregar variáveis do arquivo .env automaticamente
      env_file: '.env',

      // Variáveis sobrescritas em produção
      env_production: {
        NODE_ENV: 'production',
      },

      // Logs
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
