CREATE TABLE IF NOT EXISTS system_config (
  config_key VARCHAR(100) PRIMARY KEY,
  config_value TEXT NOT NULL,
  is_encrypted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=值已AES-256加密',
  description VARCHAR(500) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100) DEFAULT 'system'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO system_config VALUES
  ('active_adapter',             'mock',        0, '使用的适配器: mock|juhe|aliyun', NOW(), 'system'),
  ('balance_query_cron',         '0 8 * * *',   0, '每日余额查询 cron 表达式',       NOW(), 'system'),
  ('monthly_recharge_cron',      '0 9 * * *',   0, '月度充值检测 cron 表达式',       NOW(), 'system'),
  ('retry_cron',                 '*/5 * * * *', 0, '充值重试轮询 cron 表达式',       NOW(), 'system'),
  ('balance_query_concurrency',  '5',           0, '余额查询并发数',                 NOW(), 'system'),
  ('max_retry_attempts',         '3',           0, '充值失败最大重试次数',           NOW(), 'system'),
  ('retry_delay_minutes',        '30',          0, '首次重试延迟（分钟），后续翻倍', NOW(), 'system'),
  ('global_low_balance_threshold','10.00',      0, '全局低余额预警阈值（元）',       NOW(), 'system'),
  ('alert_webhook_url',          '',            0, '钉钉/飞书 Webhook URL',          NOW(), 'system'),
  ('juhe_balance_api_key',       '',            1, '聚合数据余额查询 AppKey（加密）', NOW(), 'system'),
  ('juhe_recharge_api_key',      '',            1, '聚合数据话费充值 AppKey（加密）', NOW(), 'system');
