-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.1.10-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win32
-- HeidiSQL Version:             9.4.0.5148
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT = @@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0 */;
/*!40101 SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO' */;

CREATE DATABASE IF NOT EXISTS `pemr` /*!40100 DEFAULT CHARACTER SET utf8
  COLLATE utf8_unicode_ci */;
USE `pemr`;

CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`    VARCHAR(50)
            COLLATE utf8_unicode_ci   DEFAULT '0',
  PRIMARY KEY (`role_id`)
)
  ENGINE = InnoDB
  AUTO_INCREMENT = 6
  DEFAULT CHARSET = utf8
  COLLATE = utf8_unicode_ci;


DELETE FROM `roles`;
/*!40000 ALTER TABLE `roles`
  DISABLE KEYS */;
INSERT INTO `roles` (`role_id`, `name`) VALUES
  (1, 'Developer'),
  (2, 'Admin'),
  (3, 'User');
/*!40000 ALTER TABLE `roles`
  ENABLE KEYS */;


CREATE TABLE IF NOT EXISTS `role_roles` (
  `role_id1` INT(10) UNSIGNED NOT NULL
  COMMENT 'Main role',
  `role_id2` INT(10) UNSIGNED NOT NULL
  COMMENT 'Role it can access',
  KEY `role_id1` (`role_id1`),
  KEY `role_id2` (`role_id2`),
  CONSTRAINT `role_id1` FOREIGN KEY (`role_id1`) REFERENCES `roles` (`role_id`),
  CONSTRAINT `role_id2` FOREIGN KEY (`role_id2`) REFERENCES `roles` (`role_id`)
)
  ENGINE = InnoDB
  DEFAULT CHARSET = utf8
  COLLATE = utf8_unicode_ci;


DELETE FROM `role_roles`;
/*!40000 ALTER TABLE `role_roles`
  DISABLE KEYS */;
INSERT INTO `role_roles` (`role_id1`, `role_id2`) VALUES
  (1, 2),
  (1, 3),
  (1, 4),
  (2, 3);
/*!40000 ALTER TABLE `role_roles`
  ENABLE KEYS */;

CREATE TABLE IF NOT EXISTS `users` (
  `user_id`  INT(10) UNSIGNED        NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50)
             COLLATE utf8_unicode_ci NOT NULL,
  `password` VARCHAR(255)
             COLLATE utf8_unicode_ci NOT NULL,
  `role_id`  INT(10) UNSIGNED        NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `user_role_id` (`role_id`),
  CONSTRAINT `user_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
)
  ENGINE = InnoDB
  DEFAULT CHARSET = utf8
  COLLATE = utf8_unicode_ci;

DELETE FROM `users`;
/*!40000 ALTER TABLE `users`
  DISABLE KEYS */;
INSERT INTO `users` (`user_id`, `username`, `password`, `role_id`) VALUES
  (1, 'admin', '$2a$10$E6XVON4nRXTbsZyoUMmKyuwR6bfn2YZkOek//QWuQJVw.8VxVCNR.', 2);
/*!40000 ALTER TABLE `users`
  ENABLE KEYS */;

/*!40101 SET SQL_MODE = IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS = IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT = @OLD_CHARACTER_SET_CLIENT */;
