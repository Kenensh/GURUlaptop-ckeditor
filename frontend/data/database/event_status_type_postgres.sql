-- PostgreSQL version of event_status_type.sql
-- Converted from MySQL on 2025-06-18 11:03:55
-- Table: event_status_type

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1
-- 產生時間： 2024-11-20 13:57:56
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
-- 資料表結構 "event_status_type"
--

-- 如果表格已存在則刪除
DROP TABLE IF EXISTS "event_status_type" CASCADE;

CREATE TABLE "event_status_type" (
  "status_id" INTEGER(2) NOT NULL,
  "status_name" VARCHAR(20) NOT NULL
)  DEFAULT  ;

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 "event_status_type"
--
ALTER TABLE "event_status_type"
  ADD PRIMARY KEY ("status_id");

--
-- 在傾印的資料表使用自動遞增()
--

--
-- 使用資料表自動遞增() "event_status_type"
--
ALTER TABLE "event_status_type"
  MODIFY "status_id" INTEGER(2) NOT NULL , =5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
