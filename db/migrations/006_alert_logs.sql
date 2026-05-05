CREATE TABLE IF NOT EXISTS alert_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone_id INT UNSIGNED NOT NULL,
  alert_type ENUM('low_balance','recharge_failed','recharge_success') NOT NULL,
  message TEXT NOT NULL,
  channel ENUM('webhook','email') NOT NULL DEFAULT 'webhook',
  status ENUM('sent','failed') NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phone_numbers(id) ON DELETE CASCADE,
  INDEX idx_phone_type (phone_id, alert_type),
  INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
