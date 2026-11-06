-- =====================================================================
-- Database aplikasi Instagram Analytics (lastdance)
-- MySQL 8 / MariaDB 10.6+ · skema + data hasil migrasi dari Google Sheets
--
-- Impor:  mysql -u <user> -p < lastdance.sql
--         (sudah menyertakan CREATE DATABASE + USE lastdance)
-- Isi: 5 user · 24 laporan · 720 metrik · 15 konten · 23 iklan
--      13 reservasi · 2 Maps · 3 Website · 1 WhatsApp · 83 audit
-- Disinkronkan ulang dari spreadsheet: 5 Nov 2026 20:17 WIB
-- =====================================================================

/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: lastdance
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `lastdance`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `lastdance` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `lastdance`;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `activity_id` char(36) NOT NULL,
  `name` varchar(600) NOT NULL,
  `date_text` varchar(40) NOT NULL DEFAULT '',
  `note` varchar(300) NOT NULL DEFAULT '',
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`activity_id`),
  KEY `idx_activities_period` (`period_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ads`
--

DROP TABLE IF EXISTS `ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ads` (
  `ad_id` char(36) NOT NULL,
  `account` varchar(20) NOT NULL,
  `image` varchar(255) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`ad_id`),
  KEY `idx_ads_account` (`account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ads`
--

LOCK TABLES `ads` WRITE;
/*!40000 ALTER TABLE `ads` DISABLE KEYS */;
INSERT INTO `ads` VALUES
('09c5a44d-aca9-44be-a9e0-0b27f2c39adb','bekam','b7ae1a88-9e28-401a-a189-7dc7bbd0043c.jpg','2026-11-05 08:05:30.209'),
('11102898-8661-4bf5-81d1-5fb1091c71b2','homecare','3f38ae77-e168-4590-8440-a79f3a2881ef.jpg','2026-11-04 06:41:43.684'),
('13c60d35-709e-48d9-aed6-08b59c23da45','bekam','0627e347-f743-4462-a80c-592e0562b04c.jpg','2026-11-05 08:07:51.843'),
('1f8148c4-7932-440c-8d7a-b257ef3131e5','homecare','223d17c8-cc4e-4ca5-8462-0c0d08889b58.jpg','2026-11-04 06:41:58.836'),
('263dfe87-81cb-4de8-8e7e-8662333a726a','klinik','497bf7ba-56a2-4beb-9495-4ad634b6d83e.jpg','2026-11-05 09:33:31.610'),
('28f49b8e-70d4-4a7c-b264-5b5e3f0e59b7','klinik','ad10aab6-8e58-4da0-afae-d4e2cecfabcd.jpg','2026-11-05 09:26:03.751'),
('2cf1c48c-2f7f-4ad5-ba31-d06bb700bf2f','klinik','227b41c7-4851-406e-82dc-5bb5d67c3937.jpg','2026-11-05 09:05:21.929'),
('32e71dc9-46d3-46a6-850d-bdf1b21176c0','klinik','184da8aa-8c55-41b0-a16b-a747bc1851fd.jpg','2026-11-05 09:32:54.791'),
('3590068e-e2a2-4f8d-8430-47d6df0619bc','klinik','51b92ca9-4c6d-418c-9bbf-9045018ae085.jpg','2026-11-05 09:31:51.434'),
('37fafcd3-c4cc-4f1b-98bc-1d9a791a5d2f','klinik','aaf23f36-700c-4fa6-8b26-93f22b6e7bdc.jpg','2026-11-05 09:31:22.516'),
('40510a8c-625a-4b35-995e-37ccdce7f25f','klinik','502320c4-e988-47a3-80c9-92fa4da7ac24.jpg','2026-11-05 09:33:13.431'),
('52033ebe-d61e-46af-87e7-a732b82c4d64','klinik','4172258f-561e-4555-b4fb-23e9980c81d9.jpg','2026-11-05 09:32:06.257'),
('6bdc866b-19a8-4775-b632-3056d3b93f32','bekam','7ab1c4f6-d729-4c89-950a-8922197ea74c.jpg','2026-11-05 08:06:20.909'),
('6cf867f1-20cc-49ea-823f-1e5ea058fb7f','klinik','32267301-157d-43d4-becb-24579ccdeedb.jpg','2026-11-05 09:03:37.665'),
('90e06567-07a6-4b59-9e7b-f7d789e780d5','klinik','a82d40c8-5ff4-4bd1-9b76-c165affdbab7.jpg','2026-11-05 09:06:41.761'),
('9adc4736-92a7-4ca1-b158-76111503df33','bekam','35105844-cecd-42d1-99fb-0b482d89f98a.jpg','2026-11-05 08:07:04.317'),
('ab690212-2d8e-474c-b492-b9625e82f2a0','klinik','4d63bd98-29b6-4c90-92a4-2de17e40dd7e.jpg','2026-11-05 09:32:40.978'),
('cd7bf994-07d4-4616-be74-493d00e787fe','klinik','852b9231-e923-414f-b191-9452bcdefb15.jpg','2026-11-05 09:04:10.892'),
('de754729-e0f2-45a0-8feb-21d558ba06a4','klinik','54749cc9-bcbc-43cd-ba7a-d6eeaef704e1.jpg','2026-11-05 09:07:49.558'),
('ed8a0c3b-d89d-4743-8ab2-28e00ba90dab','klinik','f4438a32-ea93-41b8-b8dd-d01118294d95.jpg','2026-11-05 09:31:35.394'),
('f49f59d1-2f29-4e3e-9664-3da5651beeab','klinik','9a6c547f-94d5-457d-8b8f-79ab484e4542.jpg','2026-11-05 09:06:04.793'),
('f911c121-8cb2-4d83-a09a-99355709ec71','homecare','651fc2c8-4151-48db-aef6-9e167a768ef3.jpg','2026-11-04 06:41:29.484'),
('fe7de115-e91d-411e-bc6c-839fff730f03','klinik','a72c8adc-e241-4445-9923-8d6fe70faf08.jpg','2026-11-05 09:32:25.293');
/*!40000 ALTER TABLE `ads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `change_id` char(36) NOT NULL,
  `report_id` char(36) DEFAULT NULL,
  `changed_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `action` enum('create','update','delete') NOT NULL,
  `before_json` mediumtext NOT NULL,
  `after_json` mediumtext NOT NULL,
  PRIMARY KEY (`change_id`),
  KEY `idx_audit_report` (`report_id`,`changed_at`),
  KEY `idx_audit_changed` (`changed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES
('00d99538-0d5a-4ce9-8e49-f2814f727427','3b1f7e08-71b0-458b-8913-b52e104777df','2026-11-05 09:18:35.175','create','','{\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"3b1f7e08-71b0-458b-8913-b52e104777df\",\"metrics\":{\"views\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":null,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":null,\"status\":\"valid\"}'),
('06ae06fc-6ced-4e2b-8097-fad86809b9b3','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 04:01:21.308','update','{\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-15\"}','{\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272},\"snapshot_date\":\"2026-10-15\",\"status\":\"valid\"}'),
('08d1e7cf-d0ed-45df-9e31-1b0169d851e7','ef34c0b4-04ca-4069-81b2-58ee19860184','2026-11-05 09:50:29.805','create','','{\"account\":\"academy\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":36.4,\"men\":63.6},\"age\":{\"13-17\":0,\"18-24\":15.2,\"25-34\":47.5,\"35-44\":26.3,\"45-54\":10.1,\"55-64\":1,\"65+\":0},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":35.1},{\"name\":\"Natar\",\"pct\":5.4},{\"name\":\"Jakarta\",\"pct\":2.7},{\"name\":\"Gedongtataan\",\"pct\":2.7},{\"name\":\"Karangan, Sumatera Selatan\",\"pct\":1.8}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"ef34c0b4-04ca-4069-81b2-58ee19860184\",\"metrics\":{\"views\":3261,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":1339,\"views_followers_pct\":32.66,\"views_nonfollowers_pct\":57.19,\"viewers_reels_pct\":70.53,\"viewers_post_pct\":21.22,\"viewers_story_pct\":6.59,\"interactions_reels_pct\":68.63,\"interactions_post_pct\":25.49,\"interactions_story_pct\":0,\"reach\":null,\"profile_visits\":69,\"external_link_taps\":2,\"interactions\":51,\"followers\":110,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-29\",\"status\":\"needs_review\"}'),
('0ae91ed2-0296-4c5e-ab55-4bab9032c10e','181188c3-e342-421f-b82f-c19ba2f667d9','2026-11-05 07:31:13.372','create','','{\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"metrics\":{\"views\":705376,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('0d056b14-5efb-4670-b2a6-f31361a6285e','157377ce-e47a-4815-bc6b-05ebd6bcb050','2026-11-05 08:11:07.699','create','','{\"account\":\"klinik\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":72.1,\"men\":27.9},\"age\":{\"13-17\":3.5,\"18-24\":22.9,\"25-34\":43.6,\"35-44\":20.4,\"45-54\":6.5,\"55-64\":21.1,\"65+\":1},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":39.8},{\"name\":\"Natar\",\"pct\":4.4},{\"name\":\"Jakarta\",\"pct\":2.2},{\"name\":\"Gedongtataan\",\"pct\":1.8},{\"name\":\"Metro\",\"pct\":1.4}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"157377ce-e47a-4815-bc6b-05ebd6bcb050\",\"metrics\":{\"views\":2478373,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":978940,\"views_followers_pct\":2.51,\"views_nonfollowers_pct\":93.36,\"viewers_reels_pct\":84.73,\"viewers_post_pct\":0.65,\"viewers_story_pct\":0.93,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":427487,\"profile_visits\":3485,\"external_link_taps\":208,\"interactions\":null,\"followers\":12547,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":476,\"cost_per_result\":null,\"budget\":100000,\"amount_spent\":5835931,\"impressions\":782390,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('0d8f4afd-b0c0-4f6b-9000-62ef52f5ba66','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 02:41:54.492','create','','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null},\"snapshot_date\":\"2026-10-28\",\"status\":\"valid\"}'),
('112b2d51-8e8c-4a73-a78d-4b58f332bf83','d8a19065-eb77-4e15-8802-1f9dc87401b4','2026-11-05 08:42:06.594','create','','{\"account\":\"homecare\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":78.8,\"men\":21.2},\"age\":{\"13-17\":0.2,\"18-24\":11.1,\"25-34\":33.8,\"35-44\":33.4,\"45-54\":13.9,\"55-64\":6.6,\"65+\":0.9},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":46.8},{\"name\":\"Jakarta\",\"pct\":6.2},{\"name\":\"Balikpapan\",\"pct\":2.4},{\"name\":\"Surabaya\",\"pct\":2},{\"name\":\"Depok\",\"pct\":1.6}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"d8a19065-eb77-4e15-8802-1f9dc87401b4\",\"metrics\":{\"views\":96488,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":48497,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":97.5,\"viewers_reels_pct\":20,\"viewers_post_pct\":0.75,\"viewers_story_pct\":0.23,\"interactions_reels_pct\":73.81,\"interactions_post_pct\":0.83,\"interactions_story_pct\":0.62,\"reach\":33601,\"profile_visits\":361,\"external_link_taps\":46,\"interactions\":966,\"followers\":557,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":19,\"cost_per_result\":37858,\"budget\":50000,\"amount_spent\":719299,\"impressions\":65752,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('1282727c-7186-41ad-8849-ebaf4cb34752','31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','2026-11-05 06:10:36.826','update','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":722835,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":null,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"metrics\":{\"views\":722835,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":null,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('142caba9-acf8-45ad-9a4e-f8e5fd2a3dad','273929d0-f6cf-4285-a102-90c9539c144a','2026-11-05 08:39:39.077','create','','{\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"adc6dbee-fb82-4fcd-a08a-3e8335e5bdee.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"273929d0-f6cf-4285-a102-90c9539c144a\",\"metrics\":{\"views\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":null,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":null,\"status\":\"valid\"}'),
('1d1bf58e-2d5c-4671-84eb-b080bfc8cd62','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 03:07:33.033','update','{\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"needs_review\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null},\"snapshot_date\":\"2026-10-15\",\"status\":\"needs_review\"}'),
('1d30f4f9-85c4-4099-ac59-58fc83107229','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 07:08:03.970','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":78.4,\"viewers_post_pct\":15.9,\"viewers_story_pct\":5.7,\"interactions_reels_pct\":52,\"interactions_post_pct\":38.5,\"interactions_story_pct\":9.5},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('21193f6a-6abd-425c-8cb0-4379e6e2f5ca','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 07:07:37.449','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":29140,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":78.4,\"viewers_post_pct\":15.9,\"viewers_story_pct\":5.7,\"interactions_reels_pct\":52,\"interactions_post_pct\":38.5,\"interactions_story_pct\":9.5,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('23a6a4a1-52e7-4074-8877-0860e77c6240','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 04:02:15.517','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('25c95894-5002-4ad6-ac37-90f785e10657','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 08:37:06.740','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"homecare\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":43.24,\"viewers_post_pct\":10.64,\"viewers_story_pct\":0.6,\"interactions_reels_pct\":67.08,\"interactions_post_pct\":18.3,\"interactions_story_pct\":0.45},\"snapshot_date\":\"2026-10-29\"}','{\"account\":\"homecare\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"halo tes tess\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":43.24,\"viewers_post_pct\":10.64,\"viewers_story_pct\":0.6,\"interactions_reels_pct\":67.08,\"interactions_post_pct\":18.3,\"interactions_story_pct\":0.45,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":1,\"comments\":1,\"shares\":1,\"saves\":1,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('276e3608-8f34-496d-a248-68fb3e51eb6d','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 07:14:20.944','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":29140,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('27a049e8-1a47-45c3-8c90-e9a3710ad6ed','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 07:14:20.997','update','{\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272,\"viewers\":36762,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-15\"}','{\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"viewers\":36762,\"views_followers_pct\":3,\"views_nonfollowers_pct\":97,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272},\"snapshot_date\":\"2026-10-15\",\"status\":\"valid\"}'),
('27d0e34e-7135-47cf-90f4-797909e0d791','181188c3-e342-421f-b82f-c19ba2f667d9','2026-11-05 08:00:59.070','update','{\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":null,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}'),
('2c25086b-e421-45dc-8ac0-85f548dfc735','912c2478-6d44-46ad-a236-20f7f6d90bab','2026-11-05 07:24:03.748','create','','{\"account\":\"aqur\",\"platform\":\"youtube\",\"audience\":{\"gender\":{\"women\":34,\"men\":65},\"age\":{\"13-17\":null,\"18-24\":7,\"25-34\":38,\"35-44\":25,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[\"8298e1fc-b88c-4be7-828c-5290e06bd93d.jpg\"]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"912c2478-6d44-46ad-a236-20f7f6d90bab\",\"metrics\":{\"views\":136600,\"watch_hours\":5.4,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":162,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('2dbbb7f8-f9d7-407a-9c28-011c40289a3e','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 03:34:08.343','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29.828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('32cf348f-9507-4b98-aa4a-72c5fa6b48b9','b7d932c4-3785-492e-8ee3-7cac450c7c06','2026-11-05 07:07:55.595','create','','{\"account\":\"aqur\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":34,\"men\":65},\"age\":{\"13-17\":null,\"18-24\":7,\"25-34\":38,\"35-44\":25,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"78f7286a-604c-4d1d-865a-ef8a82f30866.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"b7d932c4-3785-492e-8ee3-7cac450c7c06\",\"metrics\":{\"views\":131300,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":100,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"reach\":145337,\"profile_visits\":null,\"external_link_taps\":531,\"interactions\":38483,\"followers\":142,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":81,\"cost_per_result\":13402,\"budget\":50000,\"amount_spent\":1085592,\"impressions\":167742,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('362abc8e-a5b8-43af-bc8d-b646f0f33350','2fa50b40-34d9-4097-8d59-965e1ea2dcb1','2026-11-05 08:27:47.431','create','','{\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"2fa50b40-34d9-4097-8d59-965e1ea2dcb1\",\"metrics\":{\"views\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":null,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":null,\"status\":\"valid\"}'),
('3aa9e944-48f9-440c-8913-cff9ac89a005','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 08:41:40.876','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"halo tes tess\",\"status\":\"valid\",\"account\":\"homecare\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":1,\"comments\":1,\"shares\":1,\"saves\":1,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":43.24,\"viewers_post_pct\":10.64,\"viewers_story_pct\":0.6,\"interactions_reels_pct\":67.08,\"interactions_post_pct\":18.3,\"interactions_story_pct\":0.45},\"snapshot_date\":\"2026-10-29\"}','{\"account\":\"homecare\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":43.24,\"viewers_post_pct\":10.64,\"viewers_story_pct\":0.6,\"interactions_reels_pct\":67.08,\"interactions_post_pct\":18.3,\"interactions_story_pct\":0.45,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('3c5de563-01e5-4e59-8d83-cd3d8ad212be','aa3d445c-b316-40a9-9efa-421d88c9841e','2026-11-04 04:48:36.584','create','','{\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":64.7,\"men\":35.3},\"age\":{\"13-17\":1,\"18-24\":null,\"25-34\":39.4,\"35-44\":28.7,\"45-54\":12,\"55-64\":16,\"65+\":1.6},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":42.6},{\"name\":\"Jakarta\",\"pct\":3.5},{\"name\":\"Natar\",\"pct\":3.4},{\"name\":\"Gedongtataan\",\"pct\":1.3},{\"name\":\"Palembang\",\"pct\":1.2}],\"growth_image\":\"15f105c7-0050-4e4d-9378-769e8f184e2f.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"aa3d445c-b316-40a9-9efa-421d88c9841e\",\"metrics\":{\"views\":1422405,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":840983,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":285190,\"profile_visits\":2630,\"external_link_taps\":201,\"interactions\":69420,\"followers\":2970,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":169,\"cost_per_result\":10861,\"budget\":75000,\"amount_spent\":1835537,\"impressions\":362558,\"patients\":399,\"revenue\":50365000,\"avg_purchase\":126228},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('3cdbda97-b7f7-44dc-8bcf-60e0aa3e9629','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 07:01:59.272','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":null},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('3ced11a0-7dcc-48ca-8ad8-98da93e8a684','157377ce-e47a-4815-bc6b-05ebd6bcb050','2026-11-05 08:30:37.976','update','{\"report_id\":\"157377ce-e47a-4815-bc6b-05ebd6bcb050\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"klinik\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":72.1,\"men\":27.9},\"age\":{\"13-17\":3.5,\"18-24\":22.9,\"25-34\":43.6,\"35-44\":20.4,\"45-54\":6.5,\"55-64\":21.1,\"65+\":1},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":39.8},{\"name\":\"Natar\",\"pct\":4.4},{\"name\":\"Jakarta\",\"pct\":2.2},{\"name\":\"Gedongtataan\",\"pct\":1.8},{\"name\":\"Metro\",\"pct\":1.4}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":2478373,\"reach\":427487,\"profile_visits\":3485,\"external_link_taps\":208,\"interactions\":null,\"followers\":12547,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":476,\"cost_per_result\":null,\"budget\":100000,\"amount_spent\":5835931,\"impressions\":782390,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":978940,\"views_followers_pct\":2.51,\"views_nonfollowers_pct\":93.36,\"viewers_reels_pct\":84.73,\"viewers_post_pct\":0.65,\"viewers_story_pct\":0.93,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"157377ce-e47a-4815-bc6b-05ebd6bcb050\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"klinik\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":72.1,\"men\":27.9},\"age\":{\"13-17\":3.5,\"18-24\":22.9,\"25-34\":43.6,\"35-44\":20.4,\"45-54\":6.5,\"55-64\":21.1,\"65+\":1},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":39.8},{\"name\":\"Natar\",\"pct\":4.4},{\"name\":\"Jakarta\",\"pct\":2.2},{\"name\":\"Gedongtataan\",\"pct\":1.8},{\"name\":\"Metro\",\"pct\":1.4}],\"growth_image\":\"\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":2478373,\"reach\":427487,\"profile_visits\":3485,\"external_link_taps\":208,\"interactions\":null,\"followers\":12547,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":476,\"cost_per_result\":null,\"budget\":100000,\"amount_spent\":5835931,\"impressions\":782390,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":978940,\"views_followers_pct\":2.51,\"views_nonfollowers_pct\":93.36,\"viewers_reels_pct\":84.73,\"viewers_post_pct\":0.65,\"viewers_story_pct\":0.93,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}'),
('40fbcbb2-6b5e-4931-a7d7-24850984e0d0','31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','2026-11-05 04:52:50.502','update','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-28\",\"period_end\":\"2026-11-03\",\"recorded_at\":\"2026-11-04\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":722835,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":null,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-04\"}','{\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-28\",\"period_end\":\"2026-11-03\",\"recorded_at\":\"2026-11-04\",\"notes\":\"\",\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"metrics\":{\"views\":722835,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":null,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-04\",\"status\":\"valid\"}'),
('41d41dd5-10e1-418c-b3cf-277ffc415789','27472a57-efb2-4345-b71a-f9083c4eea9b','2026-11-05 08:36:09.933','update','{\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":20600,\"comments\":949,\"shares\":3000,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":0,\"net_followers\":365},\"snapshot_date\":\"2026-11-05\"}','{\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"metrics\":{\"views\":705376,\"watch_hours\":null,\"reward\":0,\"net_followers\":127,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":365,\"likes\":20600,\"comments\":949,\"shares\":3000,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('44e5e3e8-0908-42ab-8e47-5dfe6e9fe4c6','92093d04-96e6-4f9a-a03d-c736227619a1','2026-10-30 02:38:42.337','create','','{\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"metrics\":{\"views\":64261,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null},\"snapshot_date\":\"2026-10-21\",\"status\":\"valid\"}'),
('4921c558-aaa5-4a66-ae84-3309ab5b09a7','54cf5beb-7fe9-4ddf-bb30-e37e5bd44d00','2026-10-30 07:46:24.147','delete','{\"report_id\":\"54cf5beb-7fe9-4ddf-bb30-e37e5bd44d00\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"klinik\",\"metrics\":{\"views\":4321,\"reach\":null,\"profile_visits\":55,\"external_link_taps\":6,\"interactions\":210,\"followers\":null,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":null}',''),
('49e06812-292d-446a-8593-ca888a599f82','365f3be5-4dfe-422e-8d5a-1eebd88476e1','2026-11-05 08:09:29.107','create','','{\"account\":\"bekam\",\"platform\":\"facebook\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"365f3be5-4dfe-422e-8d5a-1eebd88476e1\",\"metrics\":{\"views\":705376,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('4a8a8583-e14a-432a-b078-a5041036323d','05dad85f-e9c9-4dc1-a58b-efeb630ec255','2026-10-30 08:55:22.660','create','','{\"account\":\"academy\",\"audience\":{\"gender\":{\"women\":78.5,\"men\":21.5},\"age\":{\"13-17\":0.5,\"18-24\":11.3,\"25-34\":32.6,\"35-44\":33.6,\"45-54\":14.1,\"55-64\":6.9,\"65+\":0.9},\"countries\":[],\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":47.5},{\"name\":\"Jakarta\",\"pct\":6.1},{\"name\":\"Balikpapan\",\"pct\":2.5},{\"name\":\"Surabaya\",\"pct\":2.1},{\"name\":\"Natar\",\"pct\":1.3}],\"growth_image\":\"d77a95a3-7214-4f71-b564-fadca2184555.jpg\"},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"05dad85f-e9c9-4dc1-a58b-efeb630ec255\",\"metrics\":{\"views\":1000,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":50,\"external_link_taps\":5,\"interactions\":80,\"followers\":null,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":null,\"status\":\"valid\"}'),
('4be1fe1f-be80-4c01-9e19-cb6435ad6297','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 03:59:13.188','update','{\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":null,\"revenue\":null},\"snapshot_date\":\"2026-10-15\"}','{\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000},\"snapshot_date\":\"2026-10-15\",\"status\":\"valid\"}'),
('4eec46ad-2be2-49df-9bc5-cc4e78715d5f','b198db5a-90b0-4404-801e-c12165f68404','2026-11-05 09:45:22.986','create','','{\"account\":\"klinik\",\"platform\":\"facebook\",\"audience\":{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"4126c3b1-3397-45fe-8764-4760e6467936.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"b198db5a-90b0-4404-801e-c12165f68404\",\"metrics\":{\"views\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":367,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('555d312f-95aa-4df7-949c-5b6445dbcb28','c01b74d3-0d6b-4546-91c4-c81068b180b7','2026-10-30 08:34:31.476','create','','{\"account\":\"homecare\",\"period_start\":\"2026-10-01\",\"period_end\":\"2026-10-07\",\"recorded_at\":\"2026-10-08\",\"notes\":\"\",\"report_id\":\"c01b74d3-0d6b-4546-91c4-c81068b180b7\",\"metrics\":{\"views\":86252,\"viewers\":58409,\"views_followers_pct\":3,\"views_nonfollowers_pct\":97,\"viewers_reels_pct\":11.39,\"viewers_post_pct\":0.82,\"viewers_story_pct\":0.27,\"interactions_reels_pct\":95.95,\"interactions_post_pct\":0.03,\"interactions_story_pct\":0,\"reach\":2714,\"profile_visits\":291,\"external_link_taps\":32,\"interactions\":3752,\"followers\":291,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":3,\"cost_per_result\":19509,\"budget\":50000,\"amount_spent\":58527,\"impressions\":3446,\"patients\":7,\"revenue\":1919000,\"avg_purchase\":274142},\"snapshot_date\":\"2026-10-08\",\"status\":\"valid\"}'),
('589e9d08-c11e-4b9d-ae1e-0bcf272612ad','181188c3-e342-421f-b82f-c19ba2f667d9','2026-11-05 08:08:17.630','update','{\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}'),
('597b38be-3743-49e2-9e24-da095abe8e9a','27472a57-efb2-4345-b71a-f9083c4eea9b','2026-11-05 08:32:20.436','update','{\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":20600,\"comments\":949,\"shares\":3000,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":0,\"net_followers\":365},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":20600,\"comments\":949,\"shares\":3000,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":0,\"net_followers\":365},\"snapshot_date\":\"2026-11-05\"}'),
('5e4554e6-a696-4059-8f65-fe7a1beb3f87','27472a57-efb2-4345-b71a-f9083c4eea9b','2026-11-05 08:38:19.402','update','{\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":365,\"likes\":20600,\"comments\":949,\"shares\":3000,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":0,\"net_followers\":127},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"c41a184c-f58a-4715-846a-41f2292315d3.jpg\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":365,\"likes\":20600,\"comments\":949,\"shares\":3000,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":0,\"net_followers\":127},\"snapshot_date\":\"2026-11-05\"}'),
('5f168ed3-f344-4578-8628-b3b502b3c709','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 03:06:34.926','create','','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null},\"snapshot_date\":\"2026-10-29\",\"status\":\"needs_review\"}'),
('60aa3738-0385-4caf-aa39-42f2d2ca8125','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 09:02:50.751','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"homecare\",\"audience\":{\"gender\":{\"women\":78.5,\"men\":21.5},\"age\":{\"13-17\":0.5,\"18-24\":1.3,\"25-34\":32.6,\"35-44\":33.6,\"45-54\":14.1,\"55-64\":6.9,\"65+\":0.9},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":47.5},{\"name\":\"Jakarta\",\"pct\":6.1},{\"name\":\"Balikpapan\",\"pct\":2.5},{\"name\":\"Surabaya\",\"pct\":2.1},{\"name\":\"Natar\",\"pct\":1.3}],\"growth_image\":\"\"},\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":43.24,\"viewers_post_pct\":10.64,\"viewers_story_pct\":0.6,\"interactions_reels_pct\":67.08,\"interactions_post_pct\":18.3,\"interactions_story_pct\":0.45},\"snapshot_date\":\"2026-10-29\"}','{\"account\":\"homecare\",\"audience\":{\"gender\":{\"women\":78.5,\"men\":21.5},\"age\":{\"13-17\":0.5,\"18-24\":1.3,\"25-34\":32.6,\"35-44\":33.6,\"45-54\":14.1,\"55-64\":6.9,\"65+\":0.9},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":47.5},{\"name\":\"Jakarta\",\"pct\":6.1},{\"name\":\"Balikpapan\",\"pct\":2.5},{\"name\":\"Surabaya\",\"pct\":2.1},{\"name\":\"Natar\",\"pct\":1.3}],\"growth_image\":\"182b1ba7-f7a8-4664-bf40-34eb9c3301c6.jpg\"},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":43.24,\"viewers_post_pct\":10.64,\"viewers_story_pct\":0.6,\"interactions_reels_pct\":67.08,\"interactions_post_pct\":18.3,\"interactions_story_pct\":0.45,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('6281995f-9aad-4b86-8253-952c91ab6a22','92093d04-96e6-4f9a-a03d-c736227619a1','2026-10-30 07:14:20.892','update','{\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":64261,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":34,\"cost_per_result\":27762,\"budget\":50000,\"amount_spent\":943899,\"impressions\":50696,\"patients\":10,\"revenue\":5102000,\"avg_purchase\":367850,\"viewers\":36905,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-22\"}','{\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"metrics\":{\"views\":64261,\"viewers\":36905,\"views_followers_pct\":3.5,\"views_nonfollowers_pct\":96.5,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":34,\"cost_per_result\":27762,\"budget\":50000,\"amount_spent\":943899,\"impressions\":50696,\"patients\":10,\"revenue\":5102000,\"avg_purchase\":367850},\"snapshot_date\":\"2026-10-22\",\"status\":\"valid\"}'),
('62db516e-233d-427f-bd06-246cc0288799','27472a57-efb2-4345-b71a-f9083c4eea9b','2026-11-05 08:18:17.799','update','{\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":20600,\"comments\":949,\"shares\":3000,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":0,\"net_followers\":365},\"snapshot_date\":\"2026-11-05\"}'),
('6a122a4f-a5ee-4871-a744-e13fcf30cd5b','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 03:05:58.466','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null},\"snapshot_date\":\"2026-10-28\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('6a7c668d-8bee-451a-ae06-e178061b3aa0','31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','2026-11-05 07:40:41.110','update','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":722835,\"reach\":145337,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":81,\"cost_per_result\":13402,\"budget\":50000,\"amount_spent\":1085592,\"impressions\":167742,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":100,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-10-29\"}','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":18.4},{\"name\":\"Jakarta\",\"pct\":3.3},{\"name\":\"Balongbendo, Jawa Timur\",\"pct\":3.3},{\"name\":\"Banda Aceh\",\"pct\":1.8},{\"name\":\"Padang\",\"pct\":1.6}],\"growth_image\":\"\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":722835,\"reach\":145337,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":81,\"cost_per_result\":13402,\"budget\":50000,\"amount_spent\":1085592,\"impressions\":167742,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":100,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-10-29\"}'),
('6e1a5b34-8c7a-4dbe-be4b-4d61d0df9efc','92093d04-96e6-4f9a-a03d-c736227619a1','2026-10-30 07:01:59.180','update','{\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":64261,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":34,\"cost_per_result\":27762,\"budget\":50000,\"amount_spent\":943899,\"impressions\":50696,\"patients\":10,\"revenue\":5102000,\"avg_purchase\":367850,\"viewers\":null},\"snapshot_date\":\"2026-10-22\"}','{\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"metrics\":{\"views\":64261,\"viewers\":36905,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":34,\"cost_per_result\":27762,\"budget\":50000,\"amount_spent\":943899,\"impressions\":50696,\"patients\":10,\"revenue\":5102000,\"avg_purchase\":367850},\"snapshot_date\":\"2026-10-22\",\"status\":\"valid\"}'),
('728f2429-1cbb-4246-83a1-58ea63eb0c3c','92093d04-96e6-4f9a-a03d-c736227619a1','2026-10-30 03:05:58.374','update','{\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":64261,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null},\"snapshot_date\":\"2026-10-21\"}','{\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"metrics\":{\"views\":64261,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null},\"snapshot_date\":\"2026-10-22\",\"status\":\"valid\"}'),
('7f44c52b-5091-469b-912c-f5fb0b4716ab','0ea49579-82a2-4ba9-af55-34aeca17ca10','2026-11-05 07:13:37.583','create','','{\"account\":\"aqur\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"f25ffa84-0194-4657-973c-98a24a884a90.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"0ea49579-82a2-4ba9-af55-34aeca17ca10\",\"metrics\":{\"views\":14800,\"watch_hours\":null,\"reward\":0,\"net_followers\":186,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":67,\"external_link_taps\":null,\"interactions\":null,\"followers\":186,\"likes\":288,\"comments\":2,\"shares\":14,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('832aada0-2318-4b81-88b9-f9ae9cd8be26','181188c3-e342-421f-b82f-c19ba2f667d9','2026-11-05 08:35:09.891','update','{\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"metrics\":{\"views\":705376,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('836491ed-3e37-4ce5-b284-423e36c2d612','31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','2026-11-05 04:55:17.002','update','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":722835,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":null,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"metrics\":{\"views\":722835,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":null,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('86fd6e68-9166-4bc6-b466-1cc3d19451fa','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 03:31:56.668','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29.828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('8943bfec-14bc-450a-a3ff-a296f75827c8','c3cc50cb-cb03-4138-86c4-21f62c720a10','2026-11-05 08:26:22.316','create','','{\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"83e52b9e-e152-4703-95b7-b76a316237e8.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"c3cc50cb-cb03-4138-86c4-21f62c720a10\",\"metrics\":{\"views\":12600,\"watch_hours\":null,\"reward\":0,\"net_followers\":36,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":104,\"external_link_taps\":null,\"interactions\":null,\"followers\":123,\"likes\":653,\"comments\":6,\"shares\":7,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('8a2347af-26e1-40e4-8fe1-747b4eecbb21','157377ce-e47a-4815-bc6b-05ebd6bcb050','2026-11-05 09:18:14.256','update','{\"report_id\":\"157377ce-e47a-4815-bc6b-05ebd6bcb050\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"klinik\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":72.1,\"men\":27.9},\"age\":{\"13-17\":3.5,\"18-24\":22.9,\"25-34\":43.6,\"35-44\":20.4,\"45-54\":6.5,\"55-64\":21.1,\"65+\":1},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":39.8},{\"name\":\"Natar\",\"pct\":4.4},{\"name\":\"Jakarta\",\"pct\":2.2},{\"name\":\"Gedongtataan\",\"pct\":1.8},{\"name\":\"Metro\",\"pct\":1.4}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":2478373,\"reach\":427487,\"profile_visits\":3485,\"external_link_taps\":208,\"interactions\":null,\"followers\":12547,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":476,\"cost_per_result\":null,\"budget\":100000,\"amount_spent\":5835931,\"impressions\":782390,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":978940,\"views_followers_pct\":2.51,\"views_nonfollowers_pct\":93.36,\"viewers_reels_pct\":84.73,\"viewers_post_pct\":0.65,\"viewers_story_pct\":0.93,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"157377ce-e47a-4815-bc6b-05ebd6bcb050\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"klinik\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":72.1,\"men\":27.9},\"age\":{\"13-17\":3.5,\"18-24\":22.9,\"25-34\":43.6,\"35-44\":20.4,\"45-54\":6.5,\"55-64\":21.1,\"65+\":1},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":39.8},{\"name\":\"Natar\",\"pct\":4.4},{\"name\":\"Jakarta\",\"pct\":2.2},{\"name\":\"Gedongtataan\",\"pct\":1.8},{\"name\":\"Metro\",\"pct\":1.4}],\"growth_image\":\"a030f66e-5f84-4f42-828a-74e8c8233e23.jpg\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":2478373,\"reach\":427487,\"profile_visits\":3485,\"external_link_taps\":208,\"interactions\":null,\"followers\":12547,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":476,\"cost_per_result\":null,\"budget\":100000,\"amount_spent\":5835931,\"impressions\":782390,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":978940,\"views_followers_pct\":2.51,\"views_nonfollowers_pct\":93.36,\"viewers_reels_pct\":84.73,\"viewers_post_pct\":0.65,\"viewers_story_pct\":0.93,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}'),
('8a2de343-f700-4673-a721-e99ac0a6b9f6','92093d04-96e6-4f9a-a03d-c736227619a1','2026-10-30 07:28:39.277','update','{\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":64261,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":34,\"cost_per_result\":27762,\"budget\":50000,\"amount_spent\":943899,\"impressions\":50696,\"patients\":10,\"revenue\":5102000,\"avg_purchase\":367850,\"viewers\":36905,\"views_followers_pct\":3.5,\"views_nonfollowers_pct\":96.5,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-22\"}','{\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"metrics\":{\"views\":64261,\"viewers\":36905,\"views_followers_pct\":3.5,\"views_nonfollowers_pct\":96.5,\"viewers_reels_pct\":69.37,\"viewers_post_pct\":0.57,\"viewers_story_pct\":0.39,\"interactions_reels_pct\":88.15,\"interactions_post_pct\":0.22,\"interactions_story_pct\":0,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":34,\"cost_per_result\":27762,\"budget\":50000,\"amount_spent\":943899,\"impressions\":50696,\"patients\":10,\"revenue\":5102000,\"avg_purchase\":367850},\"snapshot_date\":\"2026-10-22\",\"status\":\"valid\"}'),
('92d69e2b-e633-4d6d-b4b3-480ad1da1364','54cf5beb-7fe9-4ddf-bb30-e37e5bd44d00','2026-10-30 07:46:02.457','create','','{\"account\":\"klinik\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"54cf5beb-7fe9-4ddf-bb30-e37e5bd44d00\",\"metrics\":{\"views\":4321,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":55,\"external_link_taps\":6,\"interactions\":210,\"followers\":null,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":null,\"status\":\"valid\"}'),
('931e095a-c064-4736-ae7a-af4818d50efa','d8a19065-eb77-4e15-8802-1f9dc87401b4','2026-11-05 08:50:47.860','update','{\"report_id\":\"d8a19065-eb77-4e15-8802-1f9dc87401b4\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"homecare\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":78.8,\"men\":21.2},\"age\":{\"13-17\":0.2,\"18-24\":11.1,\"25-34\":33.8,\"35-44\":33.4,\"45-54\":13.9,\"55-64\":6.6,\"65+\":0.9},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":46.8},{\"name\":\"Jakarta\",\"pct\":6.2},{\"name\":\"Balikpapan\",\"pct\":2.4},{\"name\":\"Surabaya\",\"pct\":2},{\"name\":\"Depok\",\"pct\":1.6}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":96488,\"reach\":33601,\"profile_visits\":361,\"external_link_taps\":46,\"interactions\":966,\"followers\":557,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":19,\"cost_per_result\":37858,\"budget\":50000,\"amount_spent\":719299,\"impressions\":65752,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":48497,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":97.5,\"viewers_reels_pct\":20,\"viewers_post_pct\":0.75,\"viewers_story_pct\":0.23,\"interactions_reels_pct\":73.81,\"interactions_post_pct\":0.83,\"interactions_story_pct\":0.62,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"account\":\"homecare\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":78.8,\"men\":21.2},\"age\":{\"13-17\":0.2,\"18-24\":11.1,\"25-34\":33.8,\"35-44\":33.4,\"45-54\":13.9,\"55-64\":6.6,\"65+\":0.9},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":46.8},{\"name\":\"Jakarta\",\"pct\":6.2},{\"name\":\"Balikpapan\",\"pct\":2.4},{\"name\":\"Surabaya\",\"pct\":2},{\"name\":\"Depok\",\"pct\":1.6}],\"growth_image\":\"9599981f-3747-4c86-8dea-853b4f4c52bf.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"d8a19065-eb77-4e15-8802-1f9dc87401b4\",\"metrics\":{\"views\":96488,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":48497,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":97.5,\"viewers_reels_pct\":20,\"viewers_post_pct\":0.75,\"viewers_story_pct\":0.23,\"interactions_reels_pct\":73.81,\"interactions_post_pct\":0.83,\"interactions_story_pct\":0.62,\"reach\":33601,\"profile_visits\":361,\"external_link_taps\":46,\"interactions\":966,\"followers\":557,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":19,\"cost_per_result\":37858,\"budget\":50000,\"amount_spent\":719299,\"impressions\":65752,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('9c165906-2030-4fa6-8270-1216171ddb97','31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','2026-11-05 07:01:55.461','update','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":722835,\"reach\":145337,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":81,\"cost_per_result\":13402,\"budget\":50000,\"amount_spent\":1085592,\"impressions\":167742,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":100,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-10-29\"}','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":722835,\"reach\":145337,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":81,\"cost_per_result\":13402,\"budget\":50000,\"amount_spent\":1085592,\"impressions\":167742,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":100,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-10-29\"}'),
('9c90bc49-eec5-4476-9102-1838dacd6299','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 07:01:59.328','update','{\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272,\"viewers\":null},\"snapshot_date\":\"2026-10-15\"}','{\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"viewers\":36762,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272},\"snapshot_date\":\"2026-10-15\",\"status\":\"valid\"}'),
('9d8d1c1b-7625-48d0-9482-d237ec5080e1','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 03:31:15.472','update','{\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"status\":\"needs_review\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315},\"snapshot_date\":\"2026-10-15\"}','{\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315},\"snapshot_date\":\"2026-10-15\",\"status\":\"valid\"}'),
('9ec53676-a157-476c-a0b2-6537ba32cab3','05dad85f-e9c9-4dc1-a58b-efeb630ec255','2026-10-30 08:55:53.094','delete','{\"report_id\":\"05dad85f-e9c9-4dc1-a58b-efeb630ec255\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"academy\",\"audience\":{\"gender\":{\"women\":78.5,\"men\":21.5},\"age\":{\"13-17\":0.5,\"18-24\":11.3,\"25-34\":32.6,\"35-44\":33.6,\"45-54\":14.1,\"55-64\":6.9,\"65+\":0.9},\"countries\":[],\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":47.5},{\"name\":\"Jakarta\",\"pct\":6.1},{\"name\":\"Balikpapan\",\"pct\":2.5},{\"name\":\"Surabaya\",\"pct\":2.1},{\"name\":\"Natar\",\"pct\":1.3}],\"growth_image\":\"d77a95a3-7214-4f71-b564-fadca2184555.jpg\"},\"metrics\":{\"views\":1000,\"reach\":null,\"profile_visits\":50,\"external_link_taps\":5,\"interactions\":80,\"followers\":null,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":null}',''),
('9eed20b4-389b-40ab-8ea0-90fa0ae1edbc','92093d04-96e6-4f9a-a03d-c736227619a1','2026-10-30 03:31:08.415','update','{\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":64261,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null},\"snapshot_date\":\"2026-10-22\"}','{\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"metrics\":{\"views\":64261,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":34,\"cost_per_result\":27762,\"budget\":50000,\"amount_spent\":943899,\"impressions\":50696},\"snapshot_date\":\"2026-10-22\",\"status\":\"valid\"}'),
('a5b6efb5-e494-4976-bdc0-574ae6660151','181188c3-e342-421f-b82f-c19ba2f667d9','2026-11-05 08:02:57.383','update','{\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}'),
('a6aaab76-fdd4-42eb-b368-2075dacd2c77','31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','2026-11-05 07:00:43.712','update','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":722835,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":100,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-10-29\"}','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":722835,\"reach\":145337,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":81,\"cost_per_result\":13402,\"budget\":50000,\"amount_spent\":1085592,\"impressions\":167742,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":100,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-10-29\"}'),
('ab5ec36e-ba67-4b01-a92b-9a3356927a8f','27472a57-efb2-4345-b71a-f9083c4eea9b','2026-11-05 08:30:54.182','update','{\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":20600,\"comments\":949,\"shares\":3000,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":0,\"net_followers\":365},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":20600,\"comments\":949,\"shares\":3000,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"watch_hours\":null,\"reward\":0,\"net_followers\":365},\"snapshot_date\":\"2026-11-05\"}'),
('af79f16b-618a-40fc-9869-6f42a6d7386e','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 09:01:48.588','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"homecare\",\"audience\":{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\"},\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":43.24,\"viewers_post_pct\":10.64,\"viewers_story_pct\":0.6,\"interactions_reels_pct\":67.08,\"interactions_post_pct\":18.3,\"interactions_story_pct\":0.45},\"snapshot_date\":\"2026-10-29\"}','{\"account\":\"homecare\",\"audience\":{\"gender\":{\"women\":78.5,\"men\":21.5},\"age\":{\"13-17\":0.5,\"18-24\":1.3,\"25-34\":32.6,\"35-44\":33.6,\"45-54\":14.1,\"55-64\":6.9,\"65+\":0.9},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":47.5},{\"name\":\"Jakarta\",\"pct\":6.1},{\"name\":\"Balikpapan\",\"pct\":2.5},{\"name\":\"Surabaya\",\"pct\":2.1},{\"name\":\"Natar\",\"pct\":1.3}],\"growth_image\":\"\"},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":43.24,\"viewers_post_pct\":10.64,\"viewers_story_pct\":0.6,\"interactions_reels_pct\":67.08,\"interactions_post_pct\":18.3,\"interactions_story_pct\":0.45,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('b210ac28-77c7-4d58-a351-acb377bbb02c','31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','2026-11-05 04:53:57.627','update','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-28\",\"period_end\":\"2026-11-03\",\"recorded_at\":\"2026-11-04\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":722835,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":null,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-04\"}','{\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"metrics\":{\"views\":722835,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":null,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('b7ae7e29-40af-41ff-90d9-8be311b20187','912c2478-6d44-46ad-a236-20f7f6d90bab','2026-11-05 07:26:26.344','update','{\"report_id\":\"912c2478-6d44-46ad-a236-20f7f6d90bab\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"youtube\",\"audience\":{\"gender\":{\"women\":34,\"men\":65},\"age\":{\"13-17\":null,\"18-24\":7,\"25-34\":38,\"35-44\":25,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[\"8298e1fc-b88c-4be7-828c-5290e06bd93d.jpg\"]},\"metrics\":{\"views\":136600,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":162,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":5.4,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"account\":\"aqur\",\"platform\":\"youtube\",\"audience\":{\"gender\":{\"women\":34,\"men\":65},\"age\":{\"13-17\":null,\"18-24\":7,\"25-34\":38,\"35-44\":25,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[\"8298e1fc-b88c-4be7-828c-5290e06bd93d.jpg\"]},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"912c2478-6d44-46ad-a236-20f7f6d90bab\",\"metrics\":{\"views\":136600,\"watch_hours\":5.4,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":162,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('b8a3e0ca-573b-4dc4-9650-2f3bcecd2b1e','92093d04-96e6-4f9a-a03d-c736227619a1','2026-10-30 04:01:51.973','update','{\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":64261,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":34,\"cost_per_result\":27762,\"budget\":50000,\"amount_spent\":943899,\"impressions\":50696,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-22\"}','{\"period_start\":\"2026-10-15\",\"period_end\":\"2026-10-21\",\"recorded_at\":\"2026-10-22\",\"notes\":\"\",\"report_id\":\"92093d04-96e6-4f9a-a03d-c736227619a1\",\"metrics\":{\"views\":64261,\"reach\":27499,\"profile_visits\":334,\"external_link_taps\":30,\"interactions\":1815,\"followers\":460,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":34,\"cost_per_result\":27762,\"budget\":50000,\"amount_spent\":943899,\"impressions\":50696,\"patients\":10,\"revenue\":5102000,\"avg_purchase\":367850},\"snapshot_date\":\"2026-10-22\",\"status\":\"valid\"}'),
('bae59b5c-8f6a-408b-ab63-ee37123a8235','157377ce-e47a-4815-bc6b-05ebd6bcb050','2026-11-05 08:54:36.627','update','{\"report_id\":\"157377ce-e47a-4815-bc6b-05ebd6bcb050\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"klinik\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":72.1,\"men\":27.9},\"age\":{\"13-17\":3.5,\"18-24\":22.9,\"25-34\":43.6,\"35-44\":20.4,\"45-54\":6.5,\"55-64\":21.1,\"65+\":1},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":39.8},{\"name\":\"Natar\",\"pct\":4.4},{\"name\":\"Jakarta\",\"pct\":2.2},{\"name\":\"Gedongtataan\",\"pct\":1.8},{\"name\":\"Metro\",\"pct\":1.4}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":2478373,\"reach\":427487,\"profile_visits\":3485,\"external_link_taps\":208,\"interactions\":null,\"followers\":12547,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":476,\"cost_per_result\":null,\"budget\":100000,\"amount_spent\":5835931,\"impressions\":782390,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":978940,\"views_followers_pct\":2.51,\"views_nonfollowers_pct\":93.36,\"viewers_reels_pct\":84.73,\"viewers_post_pct\":0.65,\"viewers_story_pct\":0.93,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"157377ce-e47a-4815-bc6b-05ebd6bcb050\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"klinik\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":72.1,\"men\":27.9},\"age\":{\"13-17\":3.5,\"18-24\":22.9,\"25-34\":43.6,\"35-44\":20.4,\"45-54\":6.5,\"55-64\":21.1,\"65+\":1},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":39.8},{\"name\":\"Natar\",\"pct\":4.4},{\"name\":\"Jakarta\",\"pct\":2.2},{\"name\":\"Gedongtataan\",\"pct\":1.8},{\"name\":\"Metro\",\"pct\":1.4}],\"growth_image\":\"\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":2478373,\"reach\":427487,\"profile_visits\":3485,\"external_link_taps\":208,\"interactions\":null,\"followers\":12547,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":476,\"cost_per_result\":null,\"budget\":100000,\"amount_spent\":5835931,\"impressions\":782390,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":978940,\"views_followers_pct\":2.51,\"views_nonfollowers_pct\":93.36,\"viewers_reels_pct\":84.73,\"viewers_post_pct\":0.65,\"viewers_story_pct\":0.93,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}'),
('c19dc874-6c34-4f58-aef1-2f657bfc4125','8bdeaf36-5437-40ea-ae59-e4c513b00b68','2026-11-05 07:04:15.263','create','','{\"account\":\"aqur\",\"platform\":\"facebook\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"78f7286a-604c-4d1d-865a-ef8a82f30866.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"8bdeaf36-5437-40ea-ae59-e4c513b00b68\",\"metrics\":{\"views\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":100,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"reach\":145337,\"profile_visits\":null,\"external_link_taps\":531,\"interactions\":38483,\"followers\":3089,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":81,\"cost_per_result\":13402,\"budget\":50000,\"amount_spent\":1085592,\"impressions\":167742,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('c21939dd-cd44-49b8-a572-86780ae94282','27472a57-efb2-4345-b71a-f9083c4eea9b','2026-11-05 08:10:12.438','create','','{\"account\":\"bekam\",\"platform\":\"tiktok\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"27472a57-efb2-4345-b71a-f9083c4eea9b\",\"metrics\":{\"views\":705376,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":94.11,\"interactions_post_pct\":3.24,\"interactions_story_pct\":0.42,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":118750},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('c497f75d-290e-4ba6-8e37-3995ffd17304','bfb859da-5fac-4203-8b70-b35f4101ce86','2026-11-04 06:06:52.519','create','','{\"account\":\"bekam\",\"platform\":\"facebook\",\"audience\":{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"cc092724-3342-4262-a3e5-f25c5d46de69.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"bfb859da-5fac-4203-8b70-b35f4101ce86\",\"metrics\":{\"views\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":5057,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('c7fd0188-912a-46e7-b6aa-0b1388e3094e','31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','2026-11-05 04:50:41.492','create','','{\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-28\",\"period_end\":\"2026-11-03\",\"recorded_at\":\"2026-11-04\",\"notes\":\"\",\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"metrics\":{\"views\":722835,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":null,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-04\",\"status\":\"valid\"}'),
('cd75199e-fc92-44fb-89e7-067ee884e4e3','592ac027-c7f3-42f9-84d0-006c59cb1d17','2026-11-05 09:28:13.667','create','','{\"account\":\"academy\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":36.5,\"men\":63.5},\"age\":{\"13-17\":0,\"18-24\":13.5,\"25-34\":47.9,\"35-44\":27.1,\"45-54\":10.4,\"55-64\":1,\"65+\":0},\"cities\":[],\"growth_image\":\"b6aca31a-f8af-46d7-a7d7-6bd786afffa5.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-21\",\"period_end\":\"2026-10-27\",\"recorded_at\":\"2026-10-28\",\"notes\":\"\",\"report_id\":\"592ac027-c7f3-42f9-84d0-006c59cb1d17\",\"metrics\":{\"views\":3285,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":1362,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":57,\"external_link_taps\":3,\"interactions\":51,\"followers\":110,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-28\",\"status\":\"valid\"}'),
('cfa23914-ec8e-423d-8863-db04b1879749','912c2478-6d44-46ad-a236-20f7f6d90bab','2026-11-05 07:25:40.475','update','{\"report_id\":\"912c2478-6d44-46ad-a236-20f7f6d90bab\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"youtube\",\"audience\":{\"gender\":{\"women\":34,\"men\":65},\"age\":{\"13-17\":null,\"18-24\":7,\"25-34\":38,\"35-44\":25,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[\"8298e1fc-b88c-4be7-828c-5290e06bd93d.jpg\"]},\"metrics\":{\"views\":136600,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":162,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":5.4,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"account\":\"aqur\",\"platform\":\"youtube\",\"audience\":{\"gender\":{\"women\":34,\"men\":65},\"age\":{\"13-17\":null,\"18-24\":7,\"25-34\":38,\"35-44\":25,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[\"8298e1fc-b88c-4be7-828c-5290e06bd93d.jpg\"]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"912c2478-6d44-46ad-a236-20f7f6d90bab\",\"metrics\":{\"views\":136600,\"watch_hours\":5.4,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":162,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-11-05\",\"status\":\"valid\"}'),
('d2803a5a-9c44-438d-b542-9ead99138a35','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 07:13:02.288','update','{\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272,\"viewers\":36762,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-15\"}','{\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"viewers\":36762,\"views_followers_pct\":3,\"views_nonfollowers_pct\":97,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272},\"snapshot_date\":\"2026-10-15\",\"status\":\"valid\"}'),
('e79720ab-a764-43b4-b6f7-000425e31310','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 07:28:39.329','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"views_followers_pct\":3.7,\"views_nonfollowers_pct\":96.3,\"viewers_reels_pct\":43.24,\"viewers_post_pct\":10.64,\"viewers_story_pct\":0.6,\"interactions_reels_pct\":67.08,\"interactions_post_pct\":18.3,\"interactions_story_pct\":0.45,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('ea396e2a-4304-44ae-91e2-5d39bae1a740','31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','2026-11-05 06:17:23.033','update','{\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":722835,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":null,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-10-29\"}','{\"account\":\"aqur\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"31ab9004-9ae4-42e8-8351-ab8b0fe4fa83\",\"metrics\":{\"views\":722835,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":419027,\"views_followers_pct\":2.84,\"views_nonfollowers_pct\":95.89,\"viewers_reels_pct\":100,\"viewers_post_pct\":0.6,\"viewers_story_pct\":0.41,\"interactions_reels_pct\":98.74,\"interactions_post_pct\":1.05,\"interactions_story_pct\":0.21,\"reach\":null,\"profile_visits\":829,\"external_link_taps\":531,\"interactions\":38483,\"followers\":872,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('eabc2683-d472-4041-b6ea-b05b83efb0c4','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 03:30:02.377','update','{\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"status\":\"needs_review\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null},\"snapshot_date\":\"2026-10-15\"}','{\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315},\"snapshot_date\":\"2026-10-15\",\"status\":\"needs_review\"}'),
('f1218977-e4ef-47a5-93f6-e5bdc87808c1','181188c3-e342-421f-b82f-c19ba2f667d9','2026-11-05 07:59:42.140','update','{\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":null,\"revenue\":null,\"avg_purchase\":null,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}','{\"report_id\":\"181188c3-e342-421f-b82f-c19ba2f667d9\",\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"status\":\"valid\",\"account\":\"bekam\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]},\"metrics\":{\"views\":705376,\"reach\":171112,\"profile_visits\":1802,\"external_link_taps\":222,\"interactions\":27095,\"followers\":3104,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":86,\"cost_per_result\":13645,\"budget\":75000,\"amount_spent\":1173512,\"impressions\":211223,\"patients\":365,\"revenue\":43344000,\"avg_purchase\":null,\"viewers\":357162,\"views_followers_pct\":2.5,\"views_nonfollowers_pct\":90.16,\"viewers_reels_pct\":93.43,\"viewers_post_pct\":1.03,\"viewers_story_pct\":0.57,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null},\"snapshot_date\":\"2026-11-05\"}'),
('f1312611-7b4c-477c-8b29-b5ff30eff808','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 07:12:46.344','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":29140,\"views_followers_pct\":20,\"views_nonfollowers_pct\":80,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('f2089788-2115-4a59-a012-13d3d38932de','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 07:28:39.377','update','{\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272,\"viewers\":36762,\"views_followers_pct\":3,\"views_nonfollowers_pct\":97,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-15\"}','{\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"viewers\":36762,\"views_followers_pct\":3,\"views_nonfollowers_pct\":97,\"viewers_reels_pct\":79.69,\"viewers_post_pct\":0.72,\"viewers_story_pct\":0.14,\"interactions_reels_pct\":90.91,\"interactions_post_pct\":0.11,\"interactions_story_pct\":0,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272},\"snapshot_date\":\"2026-10-15\",\"status\":\"valid\"}'),
('f6b2b353-bc62-4bd1-ae99-b3764f324d6e','0aed47de-a092-4fa1-86ed-c32645ac7a4b','2026-10-30 07:11:51.824','update','{\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":62199,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964,\"viewers\":29140,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-29\"}','{\"period_start\":\"2026-10-22\",\"period_end\":\"2026-10-28\",\"recorded_at\":\"2026-10-29\",\"notes\":\"\",\"report_id\":\"0aed47de-a092-4fa1-86ed-c32645ac7a4b\",\"metrics\":{\"views\":62199,\"viewers\":29140,\"views_followers_pct\":20,\"views_nonfollowers_pct\":80,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":23716,\"profile_visits\":315,\"external_link_taps\":20,\"interactions\":896,\"followers\":526,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":23,\"cost_per_result\":29828,\"budget\":50000,\"amount_spent\":686059,\"impressions\":47281,\"patients\":8,\"revenue\":4144000,\"avg_purchase\":379964},\"snapshot_date\":\"2026-10-29\",\"status\":\"valid\"}'),
('ff61ce1f-22d0-4d54-874c-0a3b29afd99a','9938490e-90c2-49fe-9ea5-7cabf4962bba','2026-11-05 08:49:20.891','create','','{\"account\":\"homecare\",\"platform\":\"instagram\",\"audience\":{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"62d143e4-3339-4f30-afd7-0f604365521e.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]},\"period_start\":\"2026-10-29\",\"period_end\":\"2026-11-04\",\"recorded_at\":\"2026-11-05\",\"notes\":\"\",\"report_id\":\"9938490e-90c2-49fe-9ea5-7cabf4962bba\",\"metrics\":{\"views\":null,\"watch_hours\":null,\"reward\":null,\"net_followers\":null,\"viewers\":null,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":null,\"profile_visits\":null,\"external_link_taps\":null,\"interactions\":null,\"followers\":null,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":null,\"cost_per_result\":null,\"budget\":null,\"amount_spent\":null,\"impressions\":null,\"patients\":null,\"revenue\":null,\"avg_purchase\":null},\"snapshot_date\":null,\"status\":\"valid\"}'),
('ffedc2a8-7de7-48d5-b671-807f5fb39325','12e3cf90-9766-4be5-8a29-19d7ba0b9642','2026-10-30 07:13:08.178','update','{\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"status\":\"valid\",\"metrics\":{\"views\":59128,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272,\"viewers\":36762,\"views_followers_pct\":3,\"views_nonfollowers_pct\":97,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null},\"snapshot_date\":\"2026-10-15\"}','{\"period_start\":\"2026-10-08\",\"period_end\":\"2026-10-14\",\"recorded_at\":\"2026-10-15\",\"notes\":\"\",\"report_id\":\"12e3cf90-9766-4be5-8a29-19d7ba0b9642\",\"metrics\":{\"views\":59128,\"viewers\":36762,\"views_followers_pct\":null,\"views_nonfollowers_pct\":null,\"viewers_reels_pct\":null,\"viewers_post_pct\":null,\"viewers_story_pct\":null,\"interactions_reels_pct\":null,\"interactions_post_pct\":null,\"interactions_story_pct\":null,\"reach\":27499,\"profile_visits\":235,\"external_link_taps\":22,\"interactions\":1571,\"followers\":407,\"likes\":null,\"comments\":null,\"shares\":null,\"saves\":null,\"lead\":33,\"cost_per_result\":30405,\"budget\":50000,\"amount_spent\":1003381,\"impressions\":55315,\"patients\":11,\"revenue\":4843000,\"avg_purchase\":440272},\"snapshot_date\":\"2026-10-15\",\"status\":\"valid\"}');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contents`
--

DROP TABLE IF EXISTS `contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contents` (
  `content_id` char(36) NOT NULL,
  `account` varchar(20) NOT NULL,
  `platform` varchar(20) NOT NULL,
  `section` enum('top','endorsement') NOT NULL DEFAULT 'top',
  `url` varchar(500) NOT NULL,
  `thumbnail` varchar(255) NOT NULL DEFAULT '',
  `title` varchar(255) NOT NULL DEFAULT '',
  `views` bigint(20) NOT NULL DEFAULT 0,
  `likes` bigint(20) NOT NULL DEFAULT 0,
  `interactions` bigint(20) NOT NULL DEFAULT 0,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  PRIMARY KEY (`content_id`),
  KEY `idx_contents_account_period` (`account`,`platform`,`period_start`),
  CONSTRAINT `contents_period_chk` CHECK (`period_end` >= `period_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contents`
--

LOCK TABLES `contents` WRITE;
/*!40000 ALTER TABLE `contents` DISABLE KEYS */;
INSERT INTO `contents` VALUES
('084d35f0-2c30-486d-8121-66ca1ff95fe9','academy','instagram','top','https://www.instagram.com/p/DfGv49OoAKU/?utm_source=ig_web_copy_link&vrfl=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==','444fbf3f-14f8-4256-9909-d0208ff85683.jpg','Iklan Pelatihan Bekam',7876,24,34,'2026-10-21','2026-10-27'),
('27807090-72cb-4b44-8bc4-b996779ad668','bekam','instagram','top','https://www.instagram.com/reels/DfGknk3g0AW/','bc36ba17-890e-4437-9c26-99d8cbdb382e.jpg','Video Narasi',4807,104,116,'2026-10-29','2026-11-04'),
('3cc47351-5bf8-4842-8c68-88fa781c43ae','homecare','instagram','top','https://www.instagram.com/p/De_dFSqR35b','18c86a3b-7ba7-4833-90e1-59762f84880d.jpg','Kadang kita terlalu sibuk mengejar banyak hal',5059,148,170,'2026-10-22','2026-10-28'),
('3cf2113a-f53b-458e-89c7-12f477b3ca0e','homecare','instagram','top','https://www.instagram.com/p/DfJJCfxP9CC/','746aeeba-a19d-45c6-a551-deb4001c0726.jpg','-',2011,69,78,'2026-10-29','2026-11-04'),
('5131d502-82d6-4065-9936-49a3eb4d39c6','bekam','instagram','top','https://www.instagram.com/reel/DfQyEG-givf/','5180bc4a-621a-4e94-a55a-3a358f59a28b.jpg','Video Narasi',107290,1722,1830,'2026-10-29','2026-11-04'),
('51e485f4-bebe-4569-bcbc-a0ecfd3974e8','klinik','instagram','top','https://www.instagram.com/p/DfTaPxWP_iR/','fd70b5db-9be4-4190-8467-99d44ba58f8e.jpg','Narasi',218503,22130,26181,'2026-10-29','2026-11-04'),
('65964a82-d7bc-4b7d-8a42-cfcbccdc9b2a','homecare','instagram','top','https://www.instagram.com/insights/media/4017057299620658779/','af6b1d44-1225-4a9a-9ac0-d69bfbd98103.jpg','Selama Ortu Masih Ada',1229,43,50,'2026-10-22','2026-10-28'),
('8011bb4d-2416-450c-af48-e27e34e0080c','klinik','instagram','top','https://www.instagram.com/p/DfTySi3sV8D/','617117c5-7061-43fb-9a36-25bd04a5889d.jpg','Narasi',295349,25013,31375,'2026-10-29','2026-11-04'),
('80db8f9b-d123-48b9-9f39-8da34fd0b557','academy','instagram','top','https://www.instagram.com/p/DfG9AjGIfrj/?utm_source=ig_web_copy_link&dlrf=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==','11c7e798-3c05-4851-88d8-e2b89a465087.jpg','Carousel Perusahaan Raksasa',387,4,9,'2026-10-21','2026-10-27'),
('8db1ab47-6022-4ac2-aa9c-17a0f95db9d8','homecare','instagram','top','https://www.instagram.com/p/DfG8TeYRAgK/','3590dbcb-53a3-44d9-b098-f0d927ea7d4f.jpg','-',8252,122,153,'2026-10-29','2026-11-04'),
('976a1466-fb3c-40c5-bde2-5b1b8586c5c9','homecare','instagram','top','https://www.instagram.com/p/DfQ59SFPn4w/','1961c4f5-da73-4051-89bc-fa9ced461d45.jpg','-',2432,150,170,'2026-10-29','2026-11-04'),
('993816c8-8c1d-4717-8df9-ad84aa60456c','bekam','instagram','top','https://www.instagram.com/reels/DfHJ09PT87Z/','d0e36cfa-e24d-41bd-915e-cbcd914cb30c.jpg','Video Narasi',4289,189,200,'2026-10-29','2026-11-04'),
('a1a58958-3669-45e7-a4a8-60642448e592','academy','instagram','top','https://www.instagram.com/p/DfOSLJgGnFO/?utm_source=ig_web_copy_link&xtok=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==','a8c0e2ba-d0d0-4d11-a626-84a61c105ec6.jpg','Carousel Perusahaan Raksasa',483,3,7,'2026-10-21','2026-10-27'),
('ed586133-0109-4d5a-bf2e-74e337e2df98','homecare','instagram','top','https://www.instagram.com/insights/media/4017057299620658779/','4ea8f13f-c0f8-4e07-974c-9e8439950889.jpg','Terlalu Sibuk',1745,73,82,'2026-10-22','2026-10-28'),
('f87ac2c1-ac7f-4654-ac0e-b5d07f0f9a81','klinik','instagram','top','https://www.instagram.com/p/DfTmZHwJDpe/','3e0f8f8e-2c78-4267-a7fd-689288d02d40.jpg','Narasi',172326,12878,15471,'2026-10-29','2026-11-04');
/*!40000 ALTER TABLE `contents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `influencers`
--

DROP TABLE IF EXISTS `influencers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `influencers` (
  `influencer_id` char(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `handle` varchar(200) NOT NULL DEFAULT '',
  `followers` bigint(20) DEFAULT NULL,
  `note` varchar(300) NOT NULL DEFAULT '',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`influencer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `influencers`
--

LOCK TABLES `influencers` WRITE;
/*!40000 ALTER TABLE `influencers` DISABLE KEYS */;
/*!40000 ALTER TABLE `influencers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maps`
--

DROP TABLE IF EXISTS `maps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `maps` (
  `map_id` char(36) NOT NULL,
  `account` enum('klinik','bekam') NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`images`)),
  `s1` bigint(20) NOT NULL DEFAULT 0,
  `s2` bigint(20) NOT NULL DEFAULT 0,
  `s3` bigint(20) NOT NULL DEFAULT 0,
  `s4` bigint(20) NOT NULL DEFAULT 0,
  `s5` bigint(20) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`map_id`),
  KEY `idx_maps_account_period` (`account`,`period_start`),
  CONSTRAINT `maps_star_nonneg` CHECK (`s1` >= 0 and `s2` >= 0 and `s3` >= 0 and `s4` >= 0 and `s5` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maps`
--

LOCK TABLES `maps` WRITE;
/*!40000 ALTER TABLE `maps` DISABLE KEYS */;
INSERT INTO `maps` VALUES
('5052ec24-2473-4018-a1f6-cd7f61a7508f','bekam','2026-10-22','2026-10-28','[\"eb4a5719-5406-4ebe-9648-924494490f08.jpg\"]',0,0,0,1,15,'2026-11-04 06:46:24.676'),
('ea5fa258-8017-46bd-8142-dc13806f8a23','klinik','2026-10-22','2026-10-28','[\"87ff63ca-9eb4-4afc-a6f9-46a31f145f12.jpg\"]',2,1,0,2,1,'2026-11-04 06:45:23.452');
/*!40000 ALTER TABLE `maps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metrics`
--

DROP TABLE IF EXISTS `metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `metrics` (
  `report_id` char(36) NOT NULL,
  `metric_key` varchar(40) NOT NULL,
  `value` double DEFAULT NULL,
  PRIMARY KEY (`report_id`,`metric_key`),
  KEY `idx_metrics_key` (`metric_key`),
  CONSTRAINT `metrics_report_fk` FOREIGN KEY (`report_id`) REFERENCES `reports` (`report_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metrics`
--

LOCK TABLES `metrics` WRITE;
/*!40000 ALTER TABLE `metrics` DISABLE KEYS */;
INSERT INTO `metrics` VALUES
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','amount_spent',686059),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','avg_purchase',379964),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','budget',50000),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','comments',NULL),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','cost_per_result',29828),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','external_link_taps',20),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','followers',526),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','impressions',47281),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','interactions',896),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','interactions_post_pct',18.3),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','interactions_reels_pct',67.08),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','interactions_story_pct',0.45),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','lead',23),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','likes',NULL),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','net_followers',NULL),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','patients',8),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','profile_visits',315),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','reach',23716),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','revenue',4144000),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','reward',NULL),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','saves',NULL),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','shares',NULL),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','viewers',29140),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','viewers_post_pct',10.64),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','viewers_reels_pct',43.24),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','viewers_story_pct',0.6),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','views',62199),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','views_followers_pct',3.7),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','views_nonfollowers_pct',96.3),
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','watch_hours',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','amount_spent',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','avg_purchase',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','budget',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','comments',2),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','cost_per_result',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','external_link_taps',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','followers',186),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','impressions',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','interactions',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','interactions_post_pct',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','interactions_reels_pct',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','interactions_story_pct',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','lead',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','likes',288),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','net_followers',186),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','patients',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','profile_visits',67),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','reach',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','revenue',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','reward',0),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','saves',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','shares',14),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','viewers',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','viewers_post_pct',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','viewers_reels_pct',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','viewers_story_pct',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','views',14800),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','views_followers_pct',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','views_nonfollowers_pct',NULL),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','watch_hours',NULL),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','amount_spent',1003381),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','avg_purchase',440272),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','budget',50000),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','comments',NULL),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','cost_per_result',30405),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','external_link_taps',22),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','followers',407),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','impressions',55315),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','interactions',1571),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','interactions_post_pct',0.11),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','interactions_reels_pct',90.91),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','interactions_story_pct',0),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','lead',33),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','likes',NULL),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','net_followers',NULL),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','patients',11),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','profile_visits',235),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','reach',27499),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','revenue',4843000),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','reward',NULL),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','saves',NULL),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','shares',NULL),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','viewers',36762),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','viewers_post_pct',0.72),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','viewers_reels_pct',79.69),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','viewers_story_pct',0.14),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','views',59128),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','views_followers_pct',3),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','views_nonfollowers_pct',97),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','watch_hours',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','amount_spent',5835931),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','avg_purchase',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','budget',100000),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','comments',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','cost_per_result',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','external_link_taps',208),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','followers',12547),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','impressions',782390),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','interactions',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','interactions_post_pct',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','interactions_reels_pct',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','interactions_story_pct',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','lead',476),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','likes',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','net_followers',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','patients',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','profile_visits',3485),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','reach',427487),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','revenue',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','reward',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','saves',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','shares',NULL),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','viewers',978940),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','viewers_post_pct',0.65),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','viewers_reels_pct',84.73),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','viewers_story_pct',0.93),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','views',2478373),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','views_followers_pct',2.51),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','views_nonfollowers_pct',93.36),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','watch_hours',NULL),
('181188c3-e342-421f-b82f-c19ba2f667d9','amount_spent',1173512),
('181188c3-e342-421f-b82f-c19ba2f667d9','avg_purchase',118750),
('181188c3-e342-421f-b82f-c19ba2f667d9','budget',75000),
('181188c3-e342-421f-b82f-c19ba2f667d9','comments',NULL),
('181188c3-e342-421f-b82f-c19ba2f667d9','cost_per_result',13645),
('181188c3-e342-421f-b82f-c19ba2f667d9','external_link_taps',222),
('181188c3-e342-421f-b82f-c19ba2f667d9','followers',3104),
('181188c3-e342-421f-b82f-c19ba2f667d9','impressions',211223),
('181188c3-e342-421f-b82f-c19ba2f667d9','interactions',27095),
('181188c3-e342-421f-b82f-c19ba2f667d9','interactions_post_pct',3.24),
('181188c3-e342-421f-b82f-c19ba2f667d9','interactions_reels_pct',94.11),
('181188c3-e342-421f-b82f-c19ba2f667d9','interactions_story_pct',0.42),
('181188c3-e342-421f-b82f-c19ba2f667d9','lead',86),
('181188c3-e342-421f-b82f-c19ba2f667d9','likes',NULL),
('181188c3-e342-421f-b82f-c19ba2f667d9','net_followers',NULL),
('181188c3-e342-421f-b82f-c19ba2f667d9','patients',365),
('181188c3-e342-421f-b82f-c19ba2f667d9','profile_visits',1802),
('181188c3-e342-421f-b82f-c19ba2f667d9','reach',171112),
('181188c3-e342-421f-b82f-c19ba2f667d9','revenue',43344000),
('181188c3-e342-421f-b82f-c19ba2f667d9','reward',NULL),
('181188c3-e342-421f-b82f-c19ba2f667d9','saves',NULL),
('181188c3-e342-421f-b82f-c19ba2f667d9','shares',NULL),
('181188c3-e342-421f-b82f-c19ba2f667d9','viewers',357162),
('181188c3-e342-421f-b82f-c19ba2f667d9','viewers_post_pct',1.03),
('181188c3-e342-421f-b82f-c19ba2f667d9','viewers_reels_pct',93.43),
('181188c3-e342-421f-b82f-c19ba2f667d9','viewers_story_pct',0.57),
('181188c3-e342-421f-b82f-c19ba2f667d9','views',705376),
('181188c3-e342-421f-b82f-c19ba2f667d9','views_followers_pct',2.5),
('181188c3-e342-421f-b82f-c19ba2f667d9','views_nonfollowers_pct',90.16),
('181188c3-e342-421f-b82f-c19ba2f667d9','watch_hours',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','amount_spent',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','avg_purchase',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','budget',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','comments',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','cost_per_result',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','external_link_taps',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','followers',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','impressions',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','interactions',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','interactions_post_pct',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','interactions_reels_pct',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','interactions_story_pct',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','lead',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','likes',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','net_followers',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','patients',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','profile_visits',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','reach',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','revenue',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','reward',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','saves',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','shares',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','viewers',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','viewers_post_pct',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','viewers_reels_pct',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','viewers_story_pct',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','views',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','views_followers_pct',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','views_nonfollowers_pct',NULL),
('273929d0-f6cf-4285-a102-90c9539c144a','watch_hours',NULL),
('27472a57-efb2-4345-b71a-f9083c4eea9b','amount_spent',1173512),
('27472a57-efb2-4345-b71a-f9083c4eea9b','avg_purchase',118750),
('27472a57-efb2-4345-b71a-f9083c4eea9b','budget',75000),
('27472a57-efb2-4345-b71a-f9083c4eea9b','comments',949),
('27472a57-efb2-4345-b71a-f9083c4eea9b','cost_per_result',13645),
('27472a57-efb2-4345-b71a-f9083c4eea9b','external_link_taps',222),
('27472a57-efb2-4345-b71a-f9083c4eea9b','followers',365),
('27472a57-efb2-4345-b71a-f9083c4eea9b','impressions',211223),
('27472a57-efb2-4345-b71a-f9083c4eea9b','interactions',27095),
('27472a57-efb2-4345-b71a-f9083c4eea9b','interactions_post_pct',3.24),
('27472a57-efb2-4345-b71a-f9083c4eea9b','interactions_reels_pct',94.11),
('27472a57-efb2-4345-b71a-f9083c4eea9b','interactions_story_pct',0.42),
('27472a57-efb2-4345-b71a-f9083c4eea9b','lead',86),
('27472a57-efb2-4345-b71a-f9083c4eea9b','likes',20600),
('27472a57-efb2-4345-b71a-f9083c4eea9b','net_followers',127),
('27472a57-efb2-4345-b71a-f9083c4eea9b','patients',365),
('27472a57-efb2-4345-b71a-f9083c4eea9b','profile_visits',1802),
('27472a57-efb2-4345-b71a-f9083c4eea9b','reach',171112),
('27472a57-efb2-4345-b71a-f9083c4eea9b','revenue',43344000),
('27472a57-efb2-4345-b71a-f9083c4eea9b','reward',0),
('27472a57-efb2-4345-b71a-f9083c4eea9b','saves',NULL),
('27472a57-efb2-4345-b71a-f9083c4eea9b','shares',3000),
('27472a57-efb2-4345-b71a-f9083c4eea9b','viewers',357162),
('27472a57-efb2-4345-b71a-f9083c4eea9b','viewers_post_pct',1.03),
('27472a57-efb2-4345-b71a-f9083c4eea9b','viewers_reels_pct',93.43),
('27472a57-efb2-4345-b71a-f9083c4eea9b','viewers_story_pct',0.57),
('27472a57-efb2-4345-b71a-f9083c4eea9b','views',705376),
('27472a57-efb2-4345-b71a-f9083c4eea9b','views_followers_pct',2.5),
('27472a57-efb2-4345-b71a-f9083c4eea9b','views_nonfollowers_pct',90.16),
('27472a57-efb2-4345-b71a-f9083c4eea9b','watch_hours',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','amount_spent',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','avg_purchase',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','budget',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','comments',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','cost_per_result',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','external_link_taps',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','followers',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','impressions',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','interactions',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','interactions_post_pct',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','interactions_reels_pct',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','interactions_story_pct',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','lead',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','likes',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','net_followers',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','patients',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','profile_visits',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','reach',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','revenue',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','reward',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','saves',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','shares',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','viewers',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','viewers_post_pct',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','viewers_reels_pct',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','viewers_story_pct',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','views',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','views_followers_pct',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','views_nonfollowers_pct',NULL),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','watch_hours',NULL),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','amount_spent',1085592),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','avg_purchase',NULL),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','budget',50000),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','comments',NULL),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','cost_per_result',13402),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','external_link_taps',531),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','followers',872),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','impressions',167742),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','interactions',38483),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','interactions_post_pct',1.05),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','interactions_reels_pct',98.74),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','interactions_story_pct',0.21),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','lead',81),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','likes',NULL),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','net_followers',NULL),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','patients',NULL),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','profile_visits',829),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','reach',145337),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','revenue',NULL),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','reward',NULL),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','saves',NULL),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','shares',NULL),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','viewers',419027),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','viewers_post_pct',0.6),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','viewers_reels_pct',100),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','viewers_story_pct',0.41),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','views',722835),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','views_followers_pct',2.84),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','views_nonfollowers_pct',95.89),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','watch_hours',NULL),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','amount_spent',1173512),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','avg_purchase',118750),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','budget',75000),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','comments',NULL),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','cost_per_result',13645),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','external_link_taps',222),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','followers',3104),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','impressions',211223),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','interactions',27095),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','interactions_post_pct',3.24),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','interactions_reels_pct',94.11),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','interactions_story_pct',0.42),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','lead',86),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','likes',NULL),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','net_followers',NULL),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','patients',365),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','profile_visits',1802),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','reach',171112),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','revenue',43344000),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','reward',NULL),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','saves',NULL),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','shares',NULL),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','viewers',357162),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','viewers_post_pct',1.03),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','viewers_reels_pct',93.43),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','viewers_story_pct',0.57),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','views',705376),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','views_followers_pct',2.5),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','views_nonfollowers_pct',90.16),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','watch_hours',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','amount_spent',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','avg_purchase',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','budget',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','comments',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','cost_per_result',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','external_link_taps',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','followers',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','impressions',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','interactions',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','interactions_post_pct',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','interactions_reels_pct',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','interactions_story_pct',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','lead',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','likes',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','net_followers',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','patients',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','profile_visits',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','reach',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','revenue',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','reward',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','saves',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','shares',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','viewers',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','viewers_post_pct',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','viewers_reels_pct',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','viewers_story_pct',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','views',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','views_followers_pct',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','views_nonfollowers_pct',NULL),
('3b1f7e08-71b0-458b-8913-b52e104777df','watch_hours',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','amount_spent',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','avg_purchase',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','budget',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','comments',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','cost_per_result',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','external_link_taps',3),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','followers',110),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','impressions',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','interactions',51),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','interactions_post_pct',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','interactions_reels_pct',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','interactions_story_pct',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','lead',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','likes',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','net_followers',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','patients',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','profile_visits',57),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','reach',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','revenue',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','reward',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','saves',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','shares',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','viewers',1362),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','viewers_post_pct',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','viewers_reels_pct',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','viewers_story_pct',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','views',3285),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','views_followers_pct',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','views_nonfollowers_pct',NULL),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','watch_hours',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','amount_spent',1085592),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','avg_purchase',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','budget',50000),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','comments',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','cost_per_result',13402),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','external_link_taps',531),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','followers',3089),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','impressions',167742),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','interactions',38483),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','interactions_post_pct',1.05),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','interactions_reels_pct',98.74),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','interactions_story_pct',0.21),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','lead',81),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','likes',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','net_followers',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','patients',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','profile_visits',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','reach',145337),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','revenue',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','reward',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','saves',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','shares',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','viewers',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','viewers_post_pct',0.6),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','viewers_reels_pct',100),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','viewers_story_pct',0.41),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','views',NULL),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','views_followers_pct',2.84),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','views_nonfollowers_pct',95.89),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','watch_hours',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','amount_spent',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','avg_purchase',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','budget',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','comments',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','cost_per_result',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','external_link_taps',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','followers',162),
('912c2478-6d44-46ad-a236-20f7f6d90bab','impressions',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','interactions',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','interactions_post_pct',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','interactions_reels_pct',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','interactions_story_pct',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','lead',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','likes',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','net_followers',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','patients',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','profile_visits',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','reach',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','revenue',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','reward',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','saves',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','shares',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','viewers',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','viewers_post_pct',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','viewers_reels_pct',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','viewers_story_pct',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','views',136600),
('912c2478-6d44-46ad-a236-20f7f6d90bab','views_followers_pct',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','views_nonfollowers_pct',NULL),
('912c2478-6d44-46ad-a236-20f7f6d90bab','watch_hours',5.4),
('92093d04-96e6-4f9a-a03d-c736227619a1','amount_spent',943899),
('92093d04-96e6-4f9a-a03d-c736227619a1','avg_purchase',367850),
('92093d04-96e6-4f9a-a03d-c736227619a1','budget',50000),
('92093d04-96e6-4f9a-a03d-c736227619a1','comments',NULL),
('92093d04-96e6-4f9a-a03d-c736227619a1','cost_per_result',27762),
('92093d04-96e6-4f9a-a03d-c736227619a1','external_link_taps',30),
('92093d04-96e6-4f9a-a03d-c736227619a1','followers',460),
('92093d04-96e6-4f9a-a03d-c736227619a1','impressions',50696),
('92093d04-96e6-4f9a-a03d-c736227619a1','interactions',1815),
('92093d04-96e6-4f9a-a03d-c736227619a1','interactions_post_pct',0.22),
('92093d04-96e6-4f9a-a03d-c736227619a1','interactions_reels_pct',88.15),
('92093d04-96e6-4f9a-a03d-c736227619a1','interactions_story_pct',0),
('92093d04-96e6-4f9a-a03d-c736227619a1','lead',34),
('92093d04-96e6-4f9a-a03d-c736227619a1','likes',NULL),
('92093d04-96e6-4f9a-a03d-c736227619a1','net_followers',NULL),
('92093d04-96e6-4f9a-a03d-c736227619a1','patients',10),
('92093d04-96e6-4f9a-a03d-c736227619a1','profile_visits',334),
('92093d04-96e6-4f9a-a03d-c736227619a1','reach',27499),
('92093d04-96e6-4f9a-a03d-c736227619a1','revenue',5102000),
('92093d04-96e6-4f9a-a03d-c736227619a1','reward',NULL),
('92093d04-96e6-4f9a-a03d-c736227619a1','saves',NULL),
('92093d04-96e6-4f9a-a03d-c736227619a1','shares',NULL),
('92093d04-96e6-4f9a-a03d-c736227619a1','viewers',36905),
('92093d04-96e6-4f9a-a03d-c736227619a1','viewers_post_pct',0.57),
('92093d04-96e6-4f9a-a03d-c736227619a1','viewers_reels_pct',69.37),
('92093d04-96e6-4f9a-a03d-c736227619a1','viewers_story_pct',0.39),
('92093d04-96e6-4f9a-a03d-c736227619a1','views',64261),
('92093d04-96e6-4f9a-a03d-c736227619a1','views_followers_pct',3.5),
('92093d04-96e6-4f9a-a03d-c736227619a1','views_nonfollowers_pct',96.5),
('92093d04-96e6-4f9a-a03d-c736227619a1','watch_hours',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','amount_spent',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','avg_purchase',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','budget',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','comments',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','cost_per_result',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','external_link_taps',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','followers',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','impressions',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','interactions',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','interactions_post_pct',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','interactions_reels_pct',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','interactions_story_pct',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','lead',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','likes',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','net_followers',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','patients',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','profile_visits',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','reach',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','revenue',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','reward',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','saves',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','shares',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','viewers',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','viewers_post_pct',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','viewers_reels_pct',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','viewers_story_pct',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','views',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','views_followers_pct',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','views_nonfollowers_pct',NULL),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','watch_hours',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','amount_spent',1835537),
('aa3d445c-b316-40a9-9efa-421d88c9841e','avg_purchase',126228),
('aa3d445c-b316-40a9-9efa-421d88c9841e','budget',75000),
('aa3d445c-b316-40a9-9efa-421d88c9841e','comments',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','cost_per_result',10861),
('aa3d445c-b316-40a9-9efa-421d88c9841e','external_link_taps',201),
('aa3d445c-b316-40a9-9efa-421d88c9841e','followers',2970),
('aa3d445c-b316-40a9-9efa-421d88c9841e','impressions',362558),
('aa3d445c-b316-40a9-9efa-421d88c9841e','interactions',69420),
('aa3d445c-b316-40a9-9efa-421d88c9841e','interactions_post_pct',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','interactions_reels_pct',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','interactions_story_pct',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','lead',169),
('aa3d445c-b316-40a9-9efa-421d88c9841e','likes',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','net_followers',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','patients',399),
('aa3d445c-b316-40a9-9efa-421d88c9841e','profile_visits',2630),
('aa3d445c-b316-40a9-9efa-421d88c9841e','reach',285190),
('aa3d445c-b316-40a9-9efa-421d88c9841e','revenue',50365000),
('aa3d445c-b316-40a9-9efa-421d88c9841e','reward',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','saves',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','shares',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','viewers',840983),
('aa3d445c-b316-40a9-9efa-421d88c9841e','viewers_post_pct',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','viewers_reels_pct',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','viewers_story_pct',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','views',1422405),
('aa3d445c-b316-40a9-9efa-421d88c9841e','views_followers_pct',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','views_nonfollowers_pct',NULL),
('aa3d445c-b316-40a9-9efa-421d88c9841e','watch_hours',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','amount_spent',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','avg_purchase',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','budget',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','comments',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','cost_per_result',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','external_link_taps',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','followers',367),
('b198db5a-90b0-4404-801e-c12165f68404','impressions',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','interactions',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','interactions_post_pct',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','interactions_reels_pct',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','interactions_story_pct',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','lead',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','likes',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','net_followers',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','patients',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','profile_visits',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','reach',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','revenue',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','reward',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','saves',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','shares',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','viewers',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','viewers_post_pct',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','viewers_reels_pct',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','viewers_story_pct',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','views',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','views_followers_pct',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','views_nonfollowers_pct',NULL),
('b198db5a-90b0-4404-801e-c12165f68404','watch_hours',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','amount_spent',1085592),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','avg_purchase',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','budget',50000),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','comments',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','cost_per_result',13402),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','external_link_taps',531),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','followers',142),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','impressions',167742),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','interactions',38483),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','interactions_post_pct',1.05),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','interactions_reels_pct',98.74),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','interactions_story_pct',0.21),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','lead',81),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','likes',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','net_followers',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','patients',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','profile_visits',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','reach',145337),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','revenue',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','reward',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','saves',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','shares',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','viewers',NULL),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','viewers_post_pct',0.6),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','viewers_reels_pct',100),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','viewers_story_pct',0.41),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','views',131300),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','views_followers_pct',2.84),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','views_nonfollowers_pct',95.89),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','watch_hours',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','amount_spent',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','avg_purchase',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','budget',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','comments',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','cost_per_result',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','external_link_taps',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','followers',5057),
('bfb859da-5fac-4203-8b70-b35f4101ce86','impressions',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','interactions',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','interactions_post_pct',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','interactions_reels_pct',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','interactions_story_pct',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','lead',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','likes',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','net_followers',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','patients',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','profile_visits',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','reach',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','revenue',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','reward',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','saves',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','shares',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','viewers',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','viewers_post_pct',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','viewers_reels_pct',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','viewers_story_pct',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','views',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','views_followers_pct',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','views_nonfollowers_pct',NULL),
('bfb859da-5fac-4203-8b70-b35f4101ce86','watch_hours',NULL),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','amount_spent',58527),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','avg_purchase',274142),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','budget',50000),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','comments',NULL),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','cost_per_result',19509),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','external_link_taps',32),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','followers',291),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','impressions',3446),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','interactions',3752),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','interactions_post_pct',0.03),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','interactions_reels_pct',95.95),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','interactions_story_pct',0),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','lead',3),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','likes',NULL),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','net_followers',NULL),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','patients',7),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','profile_visits',291),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','reach',2714),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','revenue',1919000),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','reward',NULL),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','saves',NULL),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','shares',NULL),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','viewers',58409),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','viewers_post_pct',0.82),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','viewers_reels_pct',11.39),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','viewers_story_pct',0.27),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','views',86252),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','views_followers_pct',3),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','views_nonfollowers_pct',97),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','watch_hours',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','amount_spent',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','avg_purchase',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','budget',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','comments',6),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','cost_per_result',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','external_link_taps',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','followers',123),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','impressions',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','interactions',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','interactions_post_pct',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','interactions_reels_pct',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','interactions_story_pct',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','lead',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','likes',653),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','net_followers',36),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','patients',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','profile_visits',104),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','reach',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','revenue',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','reward',0),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','saves',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','shares',7),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','viewers',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','viewers_post_pct',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','viewers_reels_pct',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','viewers_story_pct',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','views',12600),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','views_followers_pct',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','views_nonfollowers_pct',NULL),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','watch_hours',NULL),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','amount_spent',719299),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','avg_purchase',NULL),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','budget',50000),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','comments',NULL),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','cost_per_result',37858),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','external_link_taps',46),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','followers',557),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','impressions',65752),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','interactions',966),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','interactions_post_pct',0.83),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','interactions_reels_pct',73.81),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','interactions_story_pct',0.62),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','lead',19),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','likes',NULL),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','net_followers',NULL),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','patients',NULL),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','profile_visits',361),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','reach',33601),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','revenue',NULL),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','reward',NULL),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','saves',NULL),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','shares',NULL),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','viewers',48497),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','viewers_post_pct',0.75),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','viewers_reels_pct',20),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','viewers_story_pct',0.23),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','views',96488),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','views_followers_pct',2.5),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','views_nonfollowers_pct',97.5),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','watch_hours',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','amount_spent',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','avg_purchase',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','budget',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','comments',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','cost_per_result',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','external_link_taps',2),
('ef34c0b4-04ca-4069-81b2-58ee19860184','followers',110),
('ef34c0b4-04ca-4069-81b2-58ee19860184','impressions',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','interactions',51),
('ef34c0b4-04ca-4069-81b2-58ee19860184','interactions_post_pct',25.49),
('ef34c0b4-04ca-4069-81b2-58ee19860184','interactions_reels_pct',68.63),
('ef34c0b4-04ca-4069-81b2-58ee19860184','interactions_story_pct',0),
('ef34c0b4-04ca-4069-81b2-58ee19860184','lead',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','likes',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','net_followers',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','patients',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','profile_visits',69),
('ef34c0b4-04ca-4069-81b2-58ee19860184','reach',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','revenue',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','reward',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','saves',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','shares',NULL),
('ef34c0b4-04ca-4069-81b2-58ee19860184','viewers',1339),
('ef34c0b4-04ca-4069-81b2-58ee19860184','viewers_post_pct',21.22),
('ef34c0b4-04ca-4069-81b2-58ee19860184','viewers_reels_pct',70.53),
('ef34c0b4-04ca-4069-81b2-58ee19860184','viewers_story_pct',6.59),
('ef34c0b4-04ca-4069-81b2-58ee19860184','views',3261),
('ef34c0b4-04ca-4069-81b2-58ee19860184','views_followers_pct',32.66),
('ef34c0b4-04ca-4069-81b2-58ee19860184','views_nonfollowers_pct',57.19),
('ef34c0b4-04ca-4069-81b2-58ee19860184','watch_hours',NULL);
/*!40000 ALTER TABLE `metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `report_id` char(36) NOT NULL,
  `account` varchar(20) NOT NULL,
  `platform` varchar(20) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `recorded_at` date NOT NULL,
  `notes` text NOT NULL,
  `status` enum('valid','needs_review','archived') NOT NULL DEFAULT 'valid',
  `audience` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`audience`)),
  `snapshot_date` date DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`report_id`),
  KEY `idx_reports_account_platform` (`account`,`platform`,`period_start`),
  KEY `idx_reports_period` (`period_start`,`period_end`),
  KEY `idx_reports_status` (`status`),
  KEY `idx_reports_snapshot` (`snapshot_date`),
  CONSTRAINT `reports_period_chk` CHECK (`period_end` >= `period_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES
('0aed47de-a092-4fa1-86ed-c32645ac7a4b','homecare','instagram','2026-10-22','2026-10-28','2026-10-29','','valid','{\"gender\":{\"women\":78.5,\"men\":21.5},\"age\":{\"13-17\":0.5,\"18-24\":1.3,\"25-34\":32.6,\"35-44\":33.6,\"45-54\":14.1,\"55-64\":6.9,\"65+\":0.9},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":47.5},{\"name\":\"Jakarta\",\"pct\":6.1},{\"name\":\"Balikpapan\",\"pct\":2.5},{\"name\":\"Surabaya\",\"pct\":2.1},{\"name\":\"Natar\",\"pct\":1.3}],\"growth_image\":\"182b1ba7-f7a8-4664-bf40-34eb9c3301c6.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-10-29','2026-11-05 16:59:38.143'),
('0ea49579-82a2-4ba9-af55-34aeca17ca10','aqur','tiktok','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"f25ffa84-0194-4657-973c-98a24a884a90.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-11-05','2026-11-05 16:59:38.143'),
('12e3cf90-9766-4be5-8a29-19d7ba0b9642','homecare','instagram','2026-10-08','2026-10-14','2026-10-15','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]}','2026-10-15','2026-11-05 16:59:38.143'),
('157377ce-e47a-4815-bc6b-05ebd6bcb050','klinik','instagram','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":72.1,\"men\":27.9},\"age\":{\"13-17\":3.5,\"18-24\":22.9,\"25-34\":43.6,\"35-44\":20.4,\"45-54\":6.5,\"55-64\":21.1,\"65+\":1},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":39.8},{\"name\":\"Natar\",\"pct\":4.4},{\"name\":\"Jakarta\",\"pct\":2.2},{\"name\":\"Gedongtataan\",\"pct\":1.8},{\"name\":\"Metro\",\"pct\":1.4}],\"growth_image\":\"a030f66e-5f84-4f42-828a-74e8c8233e23.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-11-05','2026-11-05 16:59:38.143'),
('181188c3-e342-421f-b82f-c19ba2f667d9','bekam','instagram','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-11-05','2026-11-05 16:59:38.143'),
('273929d0-f6cf-4285-a102-90c9539c144a','bekam','instagram','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"adc6dbee-fb82-4fcd-a08a-3e8335e5bdee.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}',NULL,'2026-11-05 16:59:38.143'),
('27472a57-efb2-4345-b71a-f9083c4eea9b','bekam','tiktok','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"c41a184c-f58a-4715-846a-41f2292315d3.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-11-05','2026-11-05 16:59:38.143'),
('2fa50b40-34d9-4097-8d59-965e1ea2dcb1','bekam','instagram','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]}',NULL,'2026-11-05 16:59:38.143'),
('31ab9004-9ae4-42e8-8351-ab8b0fe4fa83','aqur','instagram','2026-10-22','2026-10-28','2026-10-29','','valid','{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":18.4},{\"name\":\"Jakarta\",\"pct\":3.3},{\"name\":\"Balongbendo, Jawa Timur\",\"pct\":3.3},{\"name\":\"Banda Aceh\",\"pct\":1.8},{\"name\":\"Padang\",\"pct\":1.6}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-10-29','2026-11-05 16:59:38.143'),
('365f3be5-4dfe-422e-8d5a-1eebd88476e1','bekam','facebook','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":65.4,\"men\":34.6},\"age\":{\"13-17\":1,\"18-24\":14.9,\"25-34\":39.5,\"35-44\":27.9,\"45-54\":11.9,\"55-64\":3.2,\"65+\":1.5},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":38.4},{\"name\":\"Jakarta\",\"pct\":4.2},{\"name\":\"Natar\",\"pct\":3.1},{\"name\":\"Palembang\",\"pct\":1.2},{\"name\":\"Balikpapan\",\"pct\":1.2}],\"growth_image\":\"8101d165-11e0-41c1-b168-c7b54ee2c9be.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-11-05','2026-11-05 16:59:38.143'),
('3b1f7e08-71b0-458b-8913-b52e104777df','bekam','instagram','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]}',NULL,'2026-11-05 16:59:38.143'),
('592ac027-c7f3-42f9-84d0-006c59cb1d17','academy','instagram','2026-10-21','2026-10-27','2026-10-28','','valid','{\"gender\":{\"women\":36.5,\"men\":63.5},\"age\":{\"13-17\":0,\"18-24\":13.5,\"25-34\":47.9,\"35-44\":27.1,\"45-54\":10.4,\"55-64\":1,\"65+\":0},\"cities\":[],\"growth_image\":\"b6aca31a-f8af-46d7-a7d7-6bd786afffa5.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-10-28','2026-11-05 16:59:38.143'),
('8bdeaf36-5437-40ea-ae59-e4c513b00b68','aqur','facebook','2026-10-22','2026-10-28','2026-10-29','','valid','{\"gender\":{\"women\":67.3,\"men\":32.7},\"age\":{\"13-17\":2,\"18-24\":18.1,\"25-34\":52.3,\"35-44\":20.9,\"45-54\":3.9,\"55-64\":1.4,\"65+\":1.4},\"cities\":[],\"growth_image\":\"78f7286a-604c-4d1d-865a-ef8a82f30866.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-10-29','2026-11-05 16:59:38.143'),
('912c2478-6d44-46ad-a236-20f7f6d90bab','aqur','youtube','2026-10-22','2026-10-28','2026-10-29','','valid','{\"gender\":{\"women\":34,\"men\":65},\"age\":{\"13-17\":null,\"18-24\":7,\"25-34\":38,\"35-44\":25,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[\"8298e1fc-b88c-4be7-828c-5290e06bd93d.jpg\"]}','2026-10-29','2026-11-05 16:59:38.143'),
('92093d04-96e6-4f9a-a03d-c736227619a1','homecare','instagram','2026-10-15','2026-10-21','2026-10-22','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]}','2026-10-22','2026-11-05 16:59:38.143'),
('9938490e-90c2-49fe-9ea5-7cabf4962bba','homecare','instagram','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"62d143e4-3339-4f30-afd7-0f604365521e.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}',NULL,'2026-11-05 16:59:38.143'),
('aa3d445c-b316-40a9-9efa-421d88c9841e','bekam','instagram','2026-10-22','2026-10-28','2026-10-29','','valid','{\"gender\":{\"women\":64.7,\"men\":35.3},\"age\":{\"13-17\":1,\"18-24\":null,\"25-34\":39.4,\"35-44\":28.7,\"45-54\":12,\"55-64\":16,\"65+\":1.6},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":42.6},{\"name\":\"Jakarta\",\"pct\":3.5},{\"name\":\"Natar\",\"pct\":3.4},{\"name\":\"Gedongtataan\",\"pct\":1.3},{\"name\":\"Palembang\",\"pct\":1.2}],\"growth_image\":\"15f105c7-0050-4e4d-9378-769e8f184e2f.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-10-29','2026-11-05 16:59:38.143'),
('b198db5a-90b0-4404-801e-c12165f68404','klinik','facebook','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"4126c3b1-3397-45fe-8764-4760e6467936.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-11-05','2026-11-05 16:59:38.143'),
('b7d932c4-3785-492e-8ee3-7cac450c7c06','aqur','tiktok','2026-10-22','2026-10-28','2026-10-29','','valid','{\"gender\":{\"women\":34,\"men\":65},\"age\":{\"13-17\":null,\"18-24\":7,\"25-34\":38,\"35-44\":25,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"78f7286a-604c-4d1d-865a-ef8a82f30866.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-10-29','2026-11-05 16:59:38.143'),
('bfb859da-5fac-4203-8b70-b35f4101ce86','bekam','facebook','2026-10-22','2026-10-28','2026-10-29','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"cc092724-3342-4262-a3e5-f25c5d46de69.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-10-29','2026-11-05 16:59:38.143'),
('c01b74d3-0d6b-4546-91c4-c81068b180b7','homecare','instagram','2026-10-01','2026-10-07','2026-10-08','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"\",\"post_images\":[],\"search_share\":null,\"search_terms\":[]}','2026-10-08','2026-11-05 16:59:38.143'),
('c3cc50cb-cb03-4138-86c4-21f62c720a10','bekam','tiktok','2026-10-22','2026-10-28','2026-10-29','','valid','{\"gender\":{\"women\":null,\"men\":null},\"age\":{\"13-17\":null,\"18-24\":null,\"25-34\":null,\"35-44\":null,\"45-54\":null,\"55-64\":null,\"65+\":null},\"cities\":[],\"growth_image\":\"83e52b9e-e152-4703-95b7-b76a316237e8.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-10-29','2026-11-05 16:59:38.143'),
('d8a19065-eb77-4e15-8802-1f9dc87401b4','homecare','instagram','2026-10-29','2026-11-04','2026-11-05','','valid','{\"gender\":{\"women\":78.8,\"men\":21.2},\"age\":{\"13-17\":0.2,\"18-24\":11.1,\"25-34\":33.8,\"35-44\":33.4,\"45-54\":13.9,\"55-64\":6.6,\"65+\":0.9},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":46.8},{\"name\":\"Jakarta\",\"pct\":6.2},{\"name\":\"Balikpapan\",\"pct\":2.4},{\"name\":\"Surabaya\",\"pct\":2},{\"name\":\"Depok\",\"pct\":1.6}],\"growth_image\":\"9599981f-3747-4c86-8dea-853b4f4c52bf.jpg\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-11-05','2026-11-05 16:59:38.143'),
('ef34c0b4-04ca-4069-81b2-58ee19860184','academy','instagram','2026-10-22','2026-10-28','2026-10-29','','needs_review','{\"gender\":{\"women\":36.4,\"men\":63.6},\"age\":{\"13-17\":0,\"18-24\":15.2,\"25-34\":47.5,\"35-44\":26.3,\"45-54\":10.1,\"55-64\":1,\"65+\":0},\"cities\":[{\"name\":\"Bandar Lampung\",\"pct\":35.1},{\"name\":\"Natar\",\"pct\":5.4},{\"name\":\"Jakarta\",\"pct\":2.7},{\"name\":\"Gedongtataan\",\"pct\":2.7},{\"name\":\"Karangan, Sumatera Selatan\",\"pct\":1.8}],\"growth_image\":\"\",\"search_share\":null,\"search_terms\":[],\"post_images\":[]}','2026-10-29','2026-11-05 16:59:38.143');
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `reservation_id` char(36) NOT NULL,
  `kind` enum('branch','treatment') NOT NULL,
  `name` varchar(80) NOT NULL,
  `count` bigint(20) NOT NULL DEFAULT 0,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`reservation_id`),
  KEY `idx_reservations_kind_period` (`kind`,`period_start`),
  CONSTRAINT `reservations_count_chk` CHECK (`count` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES
('02b4feba-a080-43a5-94a4-1da3f236086d','branch','Tirtayasa',63,'2026-10-29','2026-11-04','2026-11-05 09:14:32.629'),
('3e03aab1-e4f3-44f0-b645-c7e3d0edd167','branch','Tirtayasa',63,'2026-10-22','2026-10-28','2026-11-04 04:52:55.481'),
('43893714-69fd-4e51-af52-16bef6b8bb34','branch','Sudirman',12,'2026-10-22','2026-10-28','2026-11-04 04:58:07.939'),
('44bd074e-c1af-40ef-bbbb-ca0d1f06f34e','branch','urip',19,'2026-10-22','2026-10-28','2026-11-04 04:54:12.696'),
('56676ae4-20fe-4650-bcfb-a8a1b7fcc2d5','treatment','Bekam',124,'2026-10-29','2026-11-04','2026-11-05 09:14:46.378'),
('7661d99e-aa7f-4484-bd60-0f1ad12bba53','branch','Kemiling',78,'2026-10-22','2026-10-28','2026-11-04 04:57:46.535'),
('7de6b90e-95c6-469f-bb5f-62c54ed3ccaf','treatment','Refleksi',92,'2026-10-22','2026-10-28','2026-11-04 04:59:01.885'),
('7ef421f3-004d-428a-8262-47edab63743f','treatment','Refleksi',104,'2026-10-29','2026-11-04','2026-11-05 09:17:12.167'),
('a6200b67-96c3-4dab-a37f-c570186ee8e6','treatment','Bekam',129,'2026-10-22','2026-10-28','2026-11-04 04:58:33.618'),
('e0f21ed7-854e-4f1d-bb83-c4cab7fdfb7b','branch','Urip',25,'2026-10-29','2026-11-04','2026-11-05 09:17:44.209'),
('e9ee2ba5-8691-4173-a619-8e05f18365b6','branch','Kemiling',81,'2026-10-29','2026-11-04','2026-11-05 09:16:09.013'),
('eb742726-9adf-490e-b0bc-2a17bb808b55','treatment','Refleksi',104,'2026-10-29','2026-11-04','2026-11-05 09:17:26.671'),
('fcb71f9e-322c-43f6-b65f-29f6b486203a','treatment','Totok Wajah',9,'2026-10-22','2026-10-28','2026-11-04 06:03:34.779');
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `setting_key` varchar(64) NOT NULL,
  `value` varchar(255) NOT NULL DEFAULT '',
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES
('account_name','Jessee','2026-11-05 16:59:38.139'),
('instagram_handle','lutfy.hkl','2026-11-05 16:59:38.139');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `summary`
--

DROP TABLE IF EXISTS `summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `summary` (
  `item_id` char(36) NOT NULL,
  `kind` enum('capaian','kendala','rencana','minggu_depan') NOT NULL,
  `text` varchar(500) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`item_id`),
  KEY `idx_summary_period` (`period_start`,`kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `summary`
--

LOCK TABLES `summary` WRITE;
/*!40000 ALTER TABLE `summary` DISABLE KEYS */;
/*!40000 ALTER TABLE `summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` char(36) NOT NULL,
  `username` varchar(30) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
('068acdc6-251d-42da-85a3-8c079f9abacb','kin','user','scrypt$aUo+3cTApBaTFT4i3LYOIg==$5Mc0CFaj+b1cIEXPEZwafSbMGGBKqYRiAKQTT2RFhps=','2026-11-04 05:15:03.148'),
('0c583a9b-fde2-4d64-bbb0-55054147dae7','billa','user','scrypt$dYAGZ7thZJuabQHaFXr0WQ==$ynz6xPjR2jtUG1GYsJCxbBW6+JsKdZQ2vsBHLFDM76E=','2026-11-04 03:48:07.125'),
('7399411a-ebf2-4ceb-882f-da13b11a77f2','abim','user','scrypt$mqPI5fE5vMdmbl4D8TyOpw==$9C1JxpgHMDTHvkfKimPkIr6N/7Ay432aLV1EXqeM6jg=','2026-11-04 05:15:21.007'),
('c7a59524-39d5-4368-afdd-4b3b23a4a376','simar','user','scrypt$NyAQM1Av6LbSPVah07Zrsw==$mue4nvHH1E+WWKOPcl1M+pUPSCa7JLTD+T27DaPnhlE=','2026-11-04 05:18:44.592'),
('eb386e26-e87b-4c89-ac66-053265651ae8','jessee','admin','scrypt$OvlUF2GbtMsGryyD1NdPpw==$TqlGP8C8V/E3OSqKoyOeyum+x+9EsXFbOJM/xzRy5qw=','2026-11-04 02:00:29.641');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `v_map_rating`
--

DROP TABLE IF EXISTS `v_map_rating`;
/*!50001 DROP VIEW IF EXISTS `v_map_rating`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_map_rating` AS SELECT
 1 AS `map_id`,
  1 AS `account`,
  1 AS `period_start`,
  1 AS `period_end`,
  1 AS `total_review`,
  1 AS `avg_rating` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_report_duplicates`
--

DROP TABLE IF EXISTS `v_report_duplicates`;
/*!50001 DROP VIEW IF EXISTS `v_report_duplicates`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_report_duplicates` AS SELECT
 1 AS `account`,
  1 AS `platform`,
  1 AS `period_start`,
  1 AS `period_end`,
  1 AS `jumlah` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_report_metric`
--

DROP TABLE IF EXISTS `v_report_metric`;
/*!50001 DROP VIEW IF EXISTS `v_report_metric`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_report_metric` AS SELECT
 1 AS `report_id`,
  1 AS `account`,
  1 AS `platform`,
  1 AS `period_start`,
  1 AS `period_end`,
  1 AS `recorded_at`,
  1 AS `status`,
  1 AS `views`,
  1 AS `viewers`,
  1 AS `reach`,
  1 AS `interactions`,
  1 AS `profile_visits`,
  1 AS `link_taps`,
  1 AS `followers`,
  1 AS `leads`,
  1 AS `patients`,
  1 AS `ad_spend`,
  1 AS `revenue`,
  1 AS `cost_per_lead`,
  1 AS `avg_purchase` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `website`
--

DROP TABLE IF EXISTS `website`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `website` (
  `web_id` char(36) NOT NULL,
  `site` enum('klinik','bekam','aqur') NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`images`)),
  `visitors` bigint(20) NOT NULL DEFAULT 0,
  `views` bigint(20) NOT NULL DEFAULT 0,
  `pages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`pages`)),
  `articles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`articles`)),
  `referrers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`referrers`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`web_id`),
  KEY `idx_website_site_period` (`site`,`period_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website`
--

LOCK TABLES `website` WRITE;
/*!40000 ALTER TABLE `website` DISABLE KEYS */;
INSERT INTO `website` VALUES
('7fba7ee2-11af-4628-8d98-eb3022572e35','aqur','2026-10-22','2026-10-28','[\"294de58b-582b-49e8-b3ac-a4b9c8036ff4.jpg\"]',37,81,'[]','[]','[{\"name\":\"google.com\",\"count\":12},{\"name\":\"I.instagram\",\"count\":8},{\"name\":\"klinikkosasih.com\",\"count\":2}]','2026-11-04 06:56:22.993'),
('a408e00d-c322-4748-8a40-ab08eea271a0','klinik','2026-10-22','2026-10-28','[\"838b4805-7e43-4cf1-9eee-3f70c9abc5f2.jpg\"]',774,1128,'[{\"name\":\"Page Views\",\"count\":4},{\"name\":\"Tautan Resmi\",\"count\":203},{\"name\":\"Kosasih Medika\",\"count\":156},{\"name\":\"Kosasih Medika Rajabasa\",\"count\":53}]','[{\"name\":\"Vaksin Influenza Sebelum Umrah\",\"count\":2},{\"name\":\"Vaksin Influenza Lansia\",\"count\":5},{\"name\":\"Direktur Utama Kosasih Medika\",\"count\":6}]','[{\"name\":\"Domain Address Referrals\",\"count\":4},{\"name\":\"google.com\",\"count\":253},{\"name\":\"linstagram.com\",\"count\":151},{\"name\":\"|.facebook.com\",\"count\":45},{\"name\":\"m.facebook.com\",\"count\":12},{\"name\":\"instagram.com\",\"count\":1}]','2026-11-04 06:49:37.209'),
('e1ae84bb-678c-446d-9750-1704a95bd34e','bekam','2026-10-22','2026-10-28','[\"61cc8cbd-894b-438c-8cdd-aa9783ccc4fb.jpg\"]',72,134,'[{\"name\":\"Tautan Resmi\",\"count\":56},{\"name\":\"Bekam Kosasih\",\"count\":46}]','[{\"name\":\"Sport Massage di Bandar Lampu\",\"count\":19}]','[{\"name\":\"l.instagram.com\",\"count\":49},{\"name\":\"google.com\",\"count\":9},{\"name\":\"android-app\",\"count\":4}]','2026-11-04 06:52:54.673');
/*!40000 ALTER TABLE `website` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp`
--

DROP TABLE IF EXISTS `whatsapp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp` (
  `wa_id` char(36) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `chats_in` bigint(20) NOT NULL DEFAULT 0,
  `saved_contacts` bigint(20) NOT NULL DEFAULT 0,
  `sw_views` bigint(20) NOT NULL DEFAULT 0,
  `uploaded_contacts` bigint(20) NOT NULL DEFAULT 0,
  `top_chats` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`top_chats`)),
  `reservations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`reservations`)),
  `unavailable` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`unavailable`)),
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`images`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`wa_id`),
  KEY `idx_whatsapp_period` (`period_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp`
--

LOCK TABLES `whatsapp` WRITE;
/*!40000 ALTER TABLE `whatsapp` DISABLE KEYS */;
INSERT INTO `whatsapp` VALUES
('5923d456-dfaf-4d7f-9a18-94455432aa25','2026-10-22','2026-10-28',8832,82,48,2779,'[{\"name\":\"Gigi\",\"count\":0},{\"name\":\"Rontgen\",\"count\":0},{\"name\":\"HPV\",\"count\":0},{\"name\":\"MCU\",\"count\":0},{\"name\":\"IMS\",\"count\":0}]','[{\"name\":\"Urip\",\"count\":20},{\"name\":\"Kemiling\",\"count\":6},{\"name\":\"Sudirman\",\"count\":4},{\"name\":\"Tirtayasa\",\"count\":6},{\"name\":\"Rajabasa\",\"count\":9}]','[{\"name\":\"Pemeriksaan Mata\",\"count\":8},{\"name\":\"Taman Gigi\",\"count\":8},{\"name\":\"Rapid Test\",\"count\":4},{\"name\":\"VCT\",\"count\":4},{\"name\":\"Vaksin Hepatitis B\",\"count\":4}]','[\"efa26087-210e-416d-9f3a-489bf72915c2.jpg\"]','2026-11-04 07:00:53.123');
/*!40000 ALTER TABLE `whatsapp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'lastdance'
--

--
-- Current Database: `lastdance`
--

USE `lastdance`;

--
-- Final view structure for view `v_map_rating`
--

/*!50001 DROP VIEW IF EXISTS `v_map_rating`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013  SQL SECURITY DEFINER */
/*!50001 VIEW `v_map_rating` AS select `maps`.`map_id` AS `map_id`,`maps`.`account` AS `account`,`maps`.`period_start` AS `period_start`,`maps`.`period_end` AS `period_end`,`maps`.`s1` + `maps`.`s2` + `maps`.`s3` + `maps`.`s4` + `maps`.`s5` AS `total_review`,round((`maps`.`s1` * 1 + `maps`.`s2` * 2 + `maps`.`s3` * 3 + `maps`.`s4` * 4 + `maps`.`s5` * 5) / nullif(`maps`.`s1` + `maps`.`s2` + `maps`.`s3` + `maps`.`s4` + `maps`.`s5`,0),2) AS `avg_rating` from `maps` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_report_duplicates`
--

/*!50001 DROP VIEW IF EXISTS `v_report_duplicates`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013  SQL SECURITY DEFINER */
/*!50001 VIEW `v_report_duplicates` AS select `reports`.`account` AS `account`,`reports`.`platform` AS `platform`,`reports`.`period_start` AS `period_start`,`reports`.`period_end` AS `period_end`,count(0) AS `jumlah` from `reports` where `reports`.`status` <> 'archived' group by `reports`.`account`,`reports`.`platform`,`reports`.`period_start`,`reports`.`period_end` having count(0) > 1 */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_report_metric`
--

/*!50001 DROP VIEW IF EXISTS `v_report_metric`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013  SQL SECURITY DEFINER */
/*!50001 VIEW `v_report_metric` AS select `r`.`report_id` AS `report_id`,`r`.`account` AS `account`,`r`.`platform` AS `platform`,`r`.`period_start` AS `period_start`,`r`.`period_end` AS `period_end`,`r`.`recorded_at` AS `recorded_at`,`r`.`status` AS `status`,max(case when `m`.`metric_key` = 'views' then `m`.`value` end) AS `views`,max(case when `m`.`metric_key` = 'viewers' then `m`.`value` end) AS `viewers`,max(case when `m`.`metric_key` = 'reach' then `m`.`value` end) AS `reach`,max(case when `m`.`metric_key` = 'interactions' then `m`.`value` end) AS `interactions`,max(case when `m`.`metric_key` = 'profile_visits' then `m`.`value` end) AS `profile_visits`,max(case when `m`.`metric_key` = 'external_link_taps' then `m`.`value` end) AS `link_taps`,max(case when `m`.`metric_key` = 'followers' then `m`.`value` end) AS `followers`,max(case when `m`.`metric_key` = 'lead' then `m`.`value` end) AS `leads`,max(case when `m`.`metric_key` = 'patients' then `m`.`value` end) AS `patients`,max(case when `m`.`metric_key` = 'amount_spent' then `m`.`value` end) AS `ad_spend`,max(case when `m`.`metric_key` = 'revenue' then `m`.`value` end) AS `revenue`,max(case when `m`.`metric_key` = 'cost_per_result' then `m`.`value` end) AS `cost_per_lead`,max(case when `m`.`metric_key` = 'avg_purchase' then `m`.`value` end) AS `avg_purchase` from (`reports` `r` left join `metrics` `m` on(`m`.`report_id` = `r`.`report_id`)) group by `r`.`report_id`,`r`.`account`,`r`.`platform`,`r`.`period_start`,`r`.`period_end`,`r`.`recorded_at`,`r`.`status` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-05 20:17:46
