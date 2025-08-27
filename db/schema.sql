-- Products tabel voor ImpexDeals
-- Run in MySQL client (pas charset/storage engine naar wens aan)

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  external_id VARCHAR(36) NOT NULL,               -- UUID of korte id die front-end gebruikt
  title VARCHAR(255) NOT NULL,
  category VARCHAR(120) DEFAULT NULL,
  price DECIMAL(12,2) DEFAULT NULL,
  qty INT DEFAULT NULL,
  `condition` VARCHAR(40) DEFAULT NULL,
  description TEXT,
  images_json JSON DEFAULT NULL,                  -- JSON array met image data/url refs
  owner_id BIGINT UNSIGNED DEFAULT NULL,
  owner_name VARCHAR(120) DEFAULT NULL,
  tags_json JSON DEFAULT NULL,
  location VARCHAR(160) DEFAULT NULL,
  min_order INT DEFAULT NULL,
  negotiable TINYINT(1) DEFAULT 0,
  vat_included TINYINT(1) DEFAULT 0,
  shipping_methods_json JSON DEFAULT NULL,
  expires_at DATETIME DEFAULT NULL,
  brand VARCHAR(120) DEFAULT NULL,
  external_link VARCHAR(500) DEFAULT NULL,
  is_draft TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_external (external_id),
  KEY idx_products_expires (expires_at),
  KEY idx_products_draft (is_draft),
  KEY idx_products_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Voorbeeld index voor zoeken op titel/category (optioneel FULLTEXT)
-- ALTER TABLE products ADD FULLTEXT KEY ft_products_title_desc (title, description);

-- Insert voorbeeldrecord (optioneel)
-- INSERT INTO products (external_id, title, price, qty) VALUES (UUID(), 'Voorbeeld Partij', 100.00, 50);
