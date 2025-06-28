-- PostgreSQL version of favorite_management.sql
-- Converted from MySQL on 2025-06-18 11:03:55
-- Table: favorite_management

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1
-- 產生時間： 2024-11-08 08:26:00
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
-- 資料庫： "project_db"
--

-- --------------------------------------------------------

--
-- 資料表結構 "favorite_management"
--

-- 如果表格已存在則刪除
DROP TABLE IF EXISTS "favorite_management" CASCADE;

CREATE TABLE "favorite_management" (
  "id" INTEGER(10) NOT NULL,
  "product_id" INTEGER(10) NOT NULL,
  "user_id" INTEGER(10) NOT NULL
)  DEFAULT  ;

--
-- 傾印資料表的資料 "favorite_management"
--

INSERT INTO "favorite_management" ("id", "product_id", "user_id") VALUES
(5, 274, 440);

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 "favorite_management"
--
ALTER TABLE "favorite_management"
  ADD PRIMARY KEY ("id");

--
-- 在傾印的資料表使用自動遞增()
--

--
-- 使用資料表自動遞增() "favorite_management"
--
ALTER TABLE "favorite_management"
  MODIFY "id" INTEGER(10) NOT NULL , =6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
