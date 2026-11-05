-- =====================================================================
-- Skema database (MySQL 8 / MariaDB 10.6+) untuk Instagram Analytics Dashboard
-- Menggantikan Google Sheets (Apps Script) sebagai penyimpanan utama.
-- Jalankan: mysql "$DATABASE_URL" < db/schema.sql   (atau: npm run db:setup)
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Pengguna & pengaturan
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id       CHAR(36)     NOT NULL,
  username      VARCHAR(30)  NOT NULL,
  role          ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(64)  NOT NULL,
  value       VARCHAR(255) NOT NULL DEFAULT '',
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (setting_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ---------------------------------------------------------------------
-- Laporan mingguan/bulanan/tahunan per akun per platform
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  report_id     CHAR(36)     NOT NULL,
  account       VARCHAR(20)  NOT NULL,
  platform      VARCHAR(20)  NOT NULL,
  period_start  DATE         NOT NULL,
  period_end    DATE         NOT NULL,
  recorded_at   DATE         NOT NULL,
  notes         TEXT         NOT NULL,
  status        ENUM('valid', 'needs_review', 'archived') NOT NULL DEFAULT 'valid',
  audience      JSON         NOT NULL,
  snapshot_date DATE         NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (report_id),
  KEY idx_reports_account_platform (account, platform, period_start),
  KEY idx_reports_period (period_start, period_end),
  KEY idx_reports_status (status),
  KEY idx_reports_snapshot (snapshot_date),
  CONSTRAINT reports_period_chk CHECK (period_end >= period_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Satu baris = satu metrik satu laporan (30 metrik per laporan, sesuai METRICS).
CREATE TABLE IF NOT EXISTS metrics (
  report_id  CHAR(36)    NOT NULL,
  metric_key VARCHAR(40) NOT NULL,
  value      DOUBLE      NULL,
  PRIMARY KEY (report_id, metric_key),
  KEY idx_metrics_key (metric_key),
  CONSTRAINT metrics_report_fk FOREIGN KEY (report_id) REFERENCES reports (report_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ---------------------------------------------------------------------
-- Konten, ringkasan, kegiatan, influencer, iklan, reservasi
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contents (
  content_id   CHAR(36)     NOT NULL,
  account      VARCHAR(20)  NOT NULL,
  platform     VARCHAR(20)  NOT NULL,
  section      ENUM('top', 'endorsement') NOT NULL DEFAULT 'top',
  url          VARCHAR(500) NOT NULL,
  thumbnail    VARCHAR(255) NOT NULL DEFAULT '',
  title        VARCHAR(255) NOT NULL DEFAULT '',
  views        BIGINT       NOT NULL DEFAULT 0,
  likes        BIGINT       NOT NULL DEFAULT 0,
  interactions BIGINT       NOT NULL DEFAULT 0,
  period_start DATE         NOT NULL,
  period_end   DATE         NOT NULL,
  PRIMARY KEY (content_id),
  KEY idx_contents_account_period (account, platform, period_start),
  CONSTRAINT contents_period_chk CHECK (period_end >= period_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS summary (
  item_id      CHAR(36)     NOT NULL,
  kind         ENUM('capaian', 'kendala', 'rencana', 'minggu_depan') NOT NULL,
  text         VARCHAR(500) NOT NULL,
  period_start DATE         NOT NULL,
  period_end   DATE         NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (item_id),
  KEY idx_summary_period (period_start, kind)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS activities (
  activity_id  CHAR(36)     NOT NULL,
  name         VARCHAR(600) NOT NULL,
  date_text    VARCHAR(40)  NOT NULL DEFAULT '',
  note         VARCHAR(300) NOT NULL DEFAULT '',
  period_start DATE         NOT NULL,
  period_end   DATE         NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (activity_id),
  KEY idx_activities_period (period_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS influencers (
  influencer_id CHAR(36)     NOT NULL,
  name          VARCHAR(120) NOT NULL,
  handle        VARCHAR(200) NOT NULL DEFAULT '',
  followers     BIGINT       NULL,
  note          VARCHAR(300) NOT NULL DEFAULT '',
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (influencer_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS ads (
  ad_id      CHAR(36)     NOT NULL,
  account    VARCHAR(20)  NOT NULL,
  image      VARCHAR(255) NOT NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (ad_id),
  KEY idx_ads_account (account)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS reservations (
  reservation_id CHAR(36)    NOT NULL,
  kind           ENUM('branch', 'treatment') NOT NULL,
  name           VARCHAR(80) NOT NULL,
  `count`        BIGINT      NOT NULL DEFAULT 0,
  period_start   DATE        NOT NULL,
  period_end     DATE        NOT NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (reservation_id),
  KEY idx_reservations_kind_period (kind, period_start),
  CONSTRAINT reservations_count_chk CHECK (`count` >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ---------------------------------------------------------------------
-- Laporan Google Maps / Website / WhatsApp
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maps (
  map_id       CHAR(36)    NOT NULL,
  account      ENUM('klinik', 'bekam') NOT NULL,
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  images       JSON        NOT NULL,
  s1           BIGINT      NOT NULL DEFAULT 0,
  s2           BIGINT      NOT NULL DEFAULT 0,
  s3           BIGINT      NOT NULL DEFAULT 0,
  s4           BIGINT      NOT NULL DEFAULT 0,
  s5           BIGINT      NOT NULL DEFAULT 0,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (map_id),
  KEY idx_maps_account_period (account, period_start),
  CONSTRAINT maps_star_nonneg CHECK (s1 >= 0 AND s2 >= 0 AND s3 >= 0 AND s4 >= 0 AND s5 >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS website (
  web_id       CHAR(36)    NOT NULL,
  site         ENUM('klinik', 'bekam', 'aqur') NOT NULL,
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  images       JSON        NOT NULL,
  visitors     BIGINT      NOT NULL DEFAULT 0,
  views        BIGINT      NOT NULL DEFAULT 0,
  pages        JSON        NOT NULL,
  articles     JSON        NOT NULL,
  referrers    JSON        NOT NULL,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (web_id),
  KEY idx_website_site_period (site, period_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS whatsapp (
  wa_id             CHAR(36)    NOT NULL,
  period_start      DATE        NOT NULL,
  period_end        DATE        NOT NULL,
  chats_in          BIGINT      NOT NULL DEFAULT 0,
  saved_contacts    BIGINT      NOT NULL DEFAULT 0,
  sw_views          BIGINT      NOT NULL DEFAULT 0,
  uploaded_contacts BIGINT      NOT NULL DEFAULT 0,
  top_chats         JSON        NOT NULL,
  reservations      JSON        NOT NULL,
  unavailable       JSON        NOT NULL,
  images            JSON        NOT NULL,
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (wa_id),
  KEY idx_whatsapp_period (period_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ---------------------------------------------------------------------
-- Jejak audit (sengaja tanpa foreign key: entri "delete" harus tetap ada)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  change_id   CHAR(36)    NOT NULL,
  report_id   CHAR(36)    NULL,
  changed_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  action      ENUM('create', 'update', 'delete') NOT NULL,
  before_json MEDIUMTEXT  NOT NULL,
  after_json  MEDIUMTEXT  NOT NULL,
  PRIMARY KEY (change_id),
  KEY idx_audit_report (report_id, changed_at),
  KEY idx_audit_changed (changed_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ---------------------------------------------------------------------
-- View bantu: KPI per laporan, rating Maps, deteksi laporan dobel
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_report_metric AS
SELECT r.report_id, r.account, r.platform, r.period_start, r.period_end, r.recorded_at, r.status,
       MAX(CASE WHEN m.metric_key = 'views' THEN m.value END)              AS views,
       MAX(CASE WHEN m.metric_key = 'viewers' THEN m.value END)            AS viewers,
       MAX(CASE WHEN m.metric_key = 'reach' THEN m.value END)              AS reach,
       MAX(CASE WHEN m.metric_key = 'interactions' THEN m.value END)       AS interactions,
       MAX(CASE WHEN m.metric_key = 'profile_visits' THEN m.value END)     AS profile_visits,
       MAX(CASE WHEN m.metric_key = 'external_link_taps' THEN m.value END) AS link_taps,
       MAX(CASE WHEN m.metric_key = 'followers' THEN m.value END)          AS followers,
       MAX(CASE WHEN m.metric_key = 'lead' THEN m.value END)               AS leads,
       MAX(CASE WHEN m.metric_key = 'patients' THEN m.value END)           AS patients,
       MAX(CASE WHEN m.metric_key = 'amount_spent' THEN m.value END)       AS ad_spend,
       MAX(CASE WHEN m.metric_key = 'revenue' THEN m.value END)            AS revenue,
       MAX(CASE WHEN m.metric_key = 'cost_per_result' THEN m.value END)    AS cost_per_lead,
       MAX(CASE WHEN m.metric_key = 'avg_purchase' THEN m.value END)       AS avg_purchase
FROM reports r
LEFT JOIN metrics m ON m.report_id = r.report_id
GROUP BY r.report_id, r.account, r.platform, r.period_start, r.period_end, r.recorded_at, r.status;

CREATE OR REPLACE VIEW v_map_rating AS
SELECT map_id, account, period_start, period_end,
       (s1 + s2 + s3 + s4 + s5) AS total_review,
       ROUND((s1 * 1 + s2 * 2 + s3 * 3 + s4 * 4 + s5 * 5)
             / NULLIF(s1 + s2 + s3 + s4 + s5, 0), 2) AS avg_rating
FROM maps;

-- Laporan dengan akun+platform+periode sama (sumber angka ganda di dashboard).
CREATE OR REPLACE VIEW v_report_duplicates AS
SELECT account, platform, period_start, period_end, COUNT(*) AS jumlah
FROM reports
WHERE status <> 'archived'
GROUP BY account, platform, period_start, period_end
HAVING COUNT(*) > 1;
