-- PostgreSQL version of coupon_user.sql
-- Converted from MySQL on 2025-06-18 11:03:55
-- Table: coupon_user

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1
-- 產生時間： 2024-11-11 08:03:48
-- 伺服器版本： 10.4.32-MariaDB
-- PHP 版本： 8.0.30

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
-- 資料表結構 "coupon_user"
--

-- 如果表格已存在則刪除
DROP TABLE IF EXISTS "coupon_user" CASCADE;

CREATE TABLE "coupon_user" (
  "id" INTEGER(20) NOT NULL,
  "user_id" INTEGER(20) NOT NULL,
  "coupon_id" INTEGER(20) NOT NULL,
  "valid" SMALLINT(1) DEFAULT 1 COMMENT '1=有效, 0=無效'
)  DEFAULT  ;

--
-- 傾印資料表的資料 "coupon_user"
--

INSERT INTO "coupon_user" ("id", "user_id", "coupon_id", "valid") VALUES
(1, 1, 1, 0);

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 "coupon_user"
--
ALTER TABLE "coupon_user"
  ADD PRIMARY KEY ("id");

--
-- 在傾印的資料表使用自動遞增()
--

--
-- 使用資料表自動遞增() "coupon_user"
--
ALTER TABLE "coupon_user"
  MODIFY "id" INTEGER(20) NOT NULL , =2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
