const express = require('express')
const mysql = require('mysql')
const BodyParser = require('body-parser')
const multer = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'assets/uploads') // Ubah direktori penyimpanan gambar menjadi 'assets/uploads'
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + '.' + file.originalname.split('.').pop()) // Ubah format nama file
  },
})
const upload = multer({ storage: storage })

const app = express()

app.use(BodyParser.urlencoded({ extended: true }))
app.use('/assets/uploads', express.static('assets/uploads'))

app.set('view engine', 'ejs')
app.set('views', 'views')

// CONFIGURATION DATABASE CONNECTION
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bookingbengkel',
})

db.connect((err) => {
  if (err) throw err
  console.log('Database connected')
  // HANDLER PELANGGAN
  app.get('/pelanggan', (req, res) => {
    const pelangganQuery = 'SELECT * FROM pelanggan'
    db.query(pelangganQuery, (err, results) => {
      const pelanggan = JSON.parse(JSON.stringify(results))
      console.log('return pelanggan data: ', pelanggan)
      res.render('pelanggan', { pelanggan: pelanggan, title: 'Data Pelanggan' })
    })
  })

  // HANDLER BENGKEL
  app.get('/bengkel', (req, res) => {
    const bengkelQuery = 'SELECT * FROM bengkel'
    db.query(bengkelQuery, (err, results) => {
      const bengkel = JSON.parse(JSON.stringify(results))
      console.log('return bengkel data: ', bengkel)
      res.render('bengkel', { bengkel: bengkel, title: 'Data Bengkel' })
    })
  })
  app.post('/tambahbengkel', upload.single('gambar'), (req, res) => {
    const nama = req.body.nama
    const alamat = req.body.alamat
    const gambar = req.file.filename

    const insertBengkelQuery = `INSERT INTO bengkel VALUES (NULL, '${nama}', '${alamat}', '${gambar}');`
    db.query(insertBengkelQuery, (err, result) => {
      if (err) throw err
      res.redirect('/bengkel')
    })
  })

  app.get('/motor', (req, res) => {
    const motorQuery =
      'SELECT * FROM motor JOIN pelanggan ON motor.id_pelanggan = pelanggan.id'
    db.query(motorQuery, (err, results) => {
      const motor = JSON.parse(JSON.stringify(results))
      console.log('return motor data: ', motor)
      res.render('motor', { motor: motor, title: 'Data Motor' })
    })
  })

  app.get('/layanan', (req, res) => {
    const layananQuery = 'SELECT * FROM layanan'
    db.query(layananQuery, (err, results) => {
      const layanan = JSON.parse(JSON.stringify(results))
      console.log('return layanan data: ', layanan)
      res.render('layanan', { layanan: layanan, title: 'Data Layanan' })
    })
  })

  app.get('/antrian', (req, res) => {
    const antrianQuery =
      'SELECT * FROM antrian a JOIN bengkel b ON a.id_bengkel = b.id_bengkel JOIN layanan l ON a.id_layanan = l.id_layanan JOIN motor m ON a.nopolisi = m.nopolisi JOIN pelanggan p ON p.id = m.id_pelanggan'
    db.query(antrianQuery, (err, results) => {
      const antrian = JSON.parse(JSON.stringify(results))
      console.log('return antrian data: ', antrian)
      res.render('antrian', {
        antrian: antrian,
        title: 'Data Antrian Pelanggan',
      })
    })
  })
})

app.listen(8000, () => {
  console.log('Server Ready')
})
