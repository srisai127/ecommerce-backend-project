-- Idempotent demo records. Safe to execute more than once.
INSERT OR IGNORE INTO categories (name, slug, description) VALUES
  ('Electronics', 'electronics', 'Everyday electronics and accessories.'),
  ('Home & Kitchen', 'home-kitchen', 'Useful products for your home.'),
  ('Books', 'books', 'Books for learning and leisure.');

INSERT OR IGNORE INTO products
  (category_id, name, description, sku, price_paise, stock_quantity)
SELECT id, 'Wireless Mouse', 'A compact wireless mouse for daily use.', 'ELEC-MOUSE-001', 79900, 25
FROM categories WHERE slug = 'electronics';

INSERT OR IGNORE INTO products
  (category_id, name, description, sku, price_paise, stock_quantity)
SELECT id, 'USB-C Hub', 'A multi-port USB-C hub for laptops.', 'ELEC-HUB-002', 149900, 12
FROM categories WHERE slug = 'electronics';

INSERT OR IGNORE INTO products
  (category_id, name, description, sku, price_paise, stock_quantity)
SELECT id, 'Insulated Bottle', 'A reusable stainless-steel water bottle.', 'HOME-BOTTLE-003', 59900, 30
FROM categories WHERE slug = 'home-kitchen';

INSERT OR IGNORE INTO products
  (category_id, name, description, sku, price_paise, stock_quantity)
SELECT id, 'Clean Code', 'A software craftsmanship book sample listing.', 'BOOK-CODE-004', 39900, 18
FROM categories WHERE slug = 'books';
