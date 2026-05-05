CREATE TABLE IF NOT EXISTS recharge_rules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone_id INT UNSIGNED DEFAULT NULL COMMENT 'NULL=全局默认规则',
  rule_name VARCHAR(100) NOT NULL,
  recharge_amount DECIMAL(10,2) NOT NULL COMMENT '充值金额（元）',
  trigger_type ENUM('monthly','low_balance','both') NOT NULL DEFAULT 'both',
  monthly_day TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '每月几号充值(1-28)',
  low_balance_threshold DECIMAL(10,2) DEFAULT NULL COMMENT '低于此余额触发（覆盖手机号级别阈值）',
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  max_monthly_recharge DECIMAL(10,2) NOT NULL DEFAULT 200.00 COMMENT '每月最大充值上限（安全防护）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phone_numbers(id) ON DELETE CASCADE,
  INDEX idx_phone (phone_id),
  INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入全局默认规则
INSERT IGNORE INTO recharge_rules (phone_id, rule_name, recharge_amount, trigger_type, monthly_day, max_monthly_recharge)
VALUES (NULL, '全局默认规则', 30.00, 'both', 1, 200.00);
