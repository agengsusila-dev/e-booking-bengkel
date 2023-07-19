-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 15, 2023 at 03:59 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.1.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bookingbengkel`
--
CREATE DATABASE IF NOT EXISTS `bookingbengkel` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `bookingbengkel`;

-- --------------------------------------------------------

--
-- Table structure for table `antrian`
--

CREATE TABLE `antrian` (
  `id_antrian` int(11) NOT NULL,
  `nopolisi` varchar(8) NOT NULL,
  `id_bengkel` int(11) NOT NULL,
  `id_layanan` int(11) NOT NULL,
  `keluhan` varchar(255) NOT NULL,
  `tanggal_booking` date NOT NULL,
  `waktu_booking` time NOT NULL,
  `waktu_transaksi` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `antrian`
--

INSERT INTO `antrian` (`id_antrian`, `nopolisi`, `id_bengkel`, `id_layanan`, `keluhan`, `tanggal_booking`, `waktu_booking`, `waktu_transaksi`) VALUES
(1, 'B4123KOP', 1, 1, 'Sedikit berat saat gas dan apabila sedang dipanasin selalu mati tidak standby.', '2023-07-13', '12:05:02', '2023-07-15 10:05:54');

-- --------------------------------------------------------

--
-- Table structure for table `bengkel`
--

CREATE TABLE `bengkel` (
  `id_bengkel` int(11) NOT NULL,
  `nama_bengkel` varchar(255) NOT NULL,
  `alamat` text NOT NULL,
  `foto_bengkel` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bengkel`
--

INSERT INTO `bengkel` (`id_bengkel`, `nama_bengkel`, `alamat`, `foto_bengkel`) VALUES
(1, 'BERKAH DATANG DARI MOTOR BEKASI', 'Jl. Palmerah II No. 32 RT 012/014 Kel. Jatibening, Kec. Pondok Gede, Kota Bekasi.', ''),
(2, 'BERKAH DATANG DARI MOTOR JAKARTA', 'Jl. Bawira Kencana I No. 12 RT 002/001 Kel. Setu, Kec. Cipayung, Kota Administrasi Jakarta Timur.', ''),
(3, 'BENGKEL BERKAH DARI MOTOR CIKARANG', 'Jl. Persatuan III No. 42 RT002/024 Kel. Sertajaya, Kecamatan Cikarang Timur, Kabupaten Bekasi', '');

-- --------------------------------------------------------

--
-- Table structure for table `layanan`
--

CREATE TABLE `layanan` (
  `id_layanan` int(11) NOT NULL,
  `nama_layanan` varchar(255) NOT NULL,
  `gambar_layanan` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `layanan`
--

INSERT INTO `layanan` (`id_layanan`, `nama_layanan`, `gambar_layanan`) VALUES
(1, 'Ganti Oli', ''),
(2, 'Tune Up', ''),
(3, 'Turun Mesin', '');

-- --------------------------------------------------------

--
-- Table structure for table `motor`
--

CREATE TABLE `motor` (
  `nopolisi` varchar(8) NOT NULL,
  `tahun` int(11) NOT NULL,
  `tipe` varchar(255) NOT NULL,
  `warna` varchar(255) NOT NULL,
  `id_pelanggan` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `motor`
--

INSERT INTO `motor` (`nopolisi`, `tahun`, `tipe`, `warna`, `id_pelanggan`) VALUES
('B2135TUI', 2015, 'Vario 150', 'Biru Tua', 3),
('B4123KOP', 2021, 'Supra X 125', 'Merah', 1),
('B4334FCB', 2023, 'NMax 150', 'Putih', 2);

-- --------------------------------------------------------

--
-- Table structure for table `pelanggan`
--

CREATE TABLE `pelanggan` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `no_telepon` varchar(15) NOT NULL,
  `alamat` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pelanggan`
--

INSERT INTO `pelanggan` (`id`, `username`, `password`, `no_telepon`, `alamat`) VALUES
(1, 'pelanggan1', 'pelanggan1', '089502110234', 'Taman Wisma Asri 2 Bekasi Utara'),
(2, 'pelanggan2', 'pelanggan2', '082121292109', 'Griya Asri 1 Cikarang Utara'),
(3, 'pelanggan3', 'pelanggan3', '088776543120', 'Cipayung Regency Utama Cipayung');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `antrian`
--
ALTER TABLE `antrian`
  ADD PRIMARY KEY (`id_antrian`),
  ADD KEY `fk_nopolisi` (`nopolisi`),
  ADD KEY `fk_id_bengkel` (`id_bengkel`),
  ADD KEY `fk_id_layanan` (`id_layanan`);

--
-- Indexes for table `bengkel`
--
ALTER TABLE `bengkel`
  ADD PRIMARY KEY (`id_bengkel`);

--
-- Indexes for table `layanan`
--
ALTER TABLE `layanan`
  ADD PRIMARY KEY (`id_layanan`);

--
-- Indexes for table `motor`
--
ALTER TABLE `motor`
  ADD PRIMARY KEY (`nopolisi`),
  ADD KEY `fk_id_pelanggan` (`id_pelanggan`);

--
-- Indexes for table `pelanggan`
--
ALTER TABLE `pelanggan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `antrian`
--
ALTER TABLE `antrian`
  MODIFY `id_antrian` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `bengkel`
--
ALTER TABLE `bengkel`
  MODIFY `id_bengkel` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `layanan`
--
ALTER TABLE `layanan`
  MODIFY `id_layanan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pelanggan`
--
ALTER TABLE `pelanggan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `antrian`
--
ALTER TABLE `antrian`
  ADD CONSTRAINT `fk_id_bengkel` FOREIGN KEY (`id_bengkel`) REFERENCES `bengkel` (`id_bengkel`),
  ADD CONSTRAINT `fk_id_layanan` FOREIGN KEY (`id_layanan`) REFERENCES `layanan` (`id_layanan`),
  ADD CONSTRAINT `fk_nopolisi` FOREIGN KEY (`nopolisi`) REFERENCES `motor` (`nopolisi`);

--
-- Constraints for table `motor`
--
ALTER TABLE `motor`
  ADD CONSTRAINT `fk_id_pelanggan` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
