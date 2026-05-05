CREATE TABLE IF NOT EXISTS balance_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone_id INT UNSIGNED NOT NULL,
  phone VARCHAR(11) NOT NULL,
  carrier ENUM('mobile','unicom','telecom') NOT NULL,
  balance DECIMAL(10,2) NOT NULL COMMENT '查询到的余额（元）',
  query_source ENUM('scheduled','manual') NOT NULL DEFAULT 'scheduled',
  adapter_name VARCHAR(64) NOT NULL,
  raw_response JSON DEFAULT NULL COMMENT '适配器原始响应（调试用）',
  queried_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phone_numbers(id) ON DELETE CASCADE,
  INDEX idx_phone_id (phone_id),
  INDEX idx_queried_at (queried_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
