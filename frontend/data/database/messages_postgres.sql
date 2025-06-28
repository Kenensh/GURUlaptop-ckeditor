-- PostgreSQL version of messages.sql
-- Converted from MySQL on 2025-06-18 11:03:55
-- Table: messages

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1
-- 產生時間： 2024-11-20 13:58:56
-- 伺服器版本： 10.4.32-MariaDB
-- PHP 版本： 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： "guru"
--

-- --------------------------------------------------------

--
-- 資料表結構 "messages"
--

-- 如果表格已存在則刪除
DROP TABLE IF EXISTS "messages" CASCADE;

CREATE TABLE "messages" (
  "id" INTEGER(11) NOT NULL,
  "sender_id" INTEGER(6) UNSIGNED NOT NULL,
  "receiver_id" INTEGER(6) UNSIGNED NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid("metadata")),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  "read_at" TIMESTAMP DEFAULT NULL
)  DEFAULT  ;

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 "messages"
--
ALTER TABLE "messages"
  ADD PRIMARY KEY ("id"),
  ADD KEY "idx_sender" ("sender_id"),
  ADD KEY "idx_receiver" ("receiver_id"),
  ADD KEY "idx_type" ("type");

--
-- 在傾印的資料表使用自動遞增()
--

--
-- 使用資料表自動遞增() "messages"
--
ALTER TABLE "messages"
  MODIFY "id" INTEGER(11) NOT NULL ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
