CREATE TABLE IF NOT EXISTS phone_numbers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(11) NOT NULL UNIQUE COMMENT '11位手机号',
  carrier ENUM('mobile','unicom','telecom') NOT NULL COMMENT '运营商',
  owner_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '归属人姓名',
  owner_id VARCHAR(64) DEFAULT NULL COMMENT '员工ID或外部引用',
  label VARCHAR(200) DEFAULT NULL COMMENT '备注标签',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  current_balance DECIMAL(10,2) DEFAULT NULL COMMENT '缓存余额（元）',
  last_query_at DATETIME DEFAULT NULL COMMENT '最近一次成功查询时间',
  low_balance_threshold DECIMAL(10,2) NOT NULL DEFAULT 10.00 COMMENT '低余额预警阈值（元）',
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL COMMENT '软删除',
  INDEX idx_carrier (carrier),
  INDEX idx_status (status),
  INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
