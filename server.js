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

app.use(express.urlencoded({ extended: true }))
app.use(BodyParser.urlencoded({ extended: true }))
app.use('/assets/uploads', express.static('assets/uploads'))

app.use((req, res, next) => {
  if (req.body && req.body._method) {
    req.method = req.body._method
    delete req.body._method
  }
  next()
})

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
      res.render('pelanggan/pelanggan', {
        pelanggan: pelanggan,
        title: 'Data Pelanggan',
        desc: 'Halaman pengelolaan pelanggan',
      })
    })
  })
  app.get('/pelanggan-ubah/:id', (req, res) => {
    const id = req.params.id
    const getPelangganQuery = `SELECT * FROM pelanggan WHERE id = '${id}';`
    console.log(req.body.username)

    db.query(getPelangganQuery, (err, result) => {
      if (err) throw err
      const pelanggan = result[0]
      res.render('pelanggan/pelanggan-ubah', { pelanggan })
    })
  })
  app.post('/pelanggan-ubah/:id', (req, res) => {
    const id = req.params.id
    const username = req.body.username
    const no_telepon = req.body.no_telepon
    const alamat = req.body.alamat

    const updatePelangganQuery = `UPDATE pelanggan SET username = '${username}', no_telepon = '${no_telepon}' , alamat = '${alamat}' WHERE id = '${id}';`
    db.query(updatePelangganQuery, (err, result) => {
      if (err) throw err
      res.redirect('/pelanggan')
    })
  })
  app.delete('/pelanggan/:id', (req, res) => {
    const id = req.params.id

    console.log('DELETE request received for ID:', id)

    const deletePelangganQuery = `DELETE FROM pelanggan WHERE id = '${id}';`
    db.query(deletePelangganQuery, (err, result) => {
      if (err) throw err
      res.redirect('/pelanggan')
    })
  })

  // HANDLER BENGKEL
  app.get('/bengkel', (req, res) => {
    const bengkelQuery = 'SELECT * FROM bengkel'
    db.query(bengkelQuery, (err, results) => {
      const bengkel = JSON.parse(JSON.stringify(results))
      console.log('return bengkel data: ', bengkel)
      res.render('bengkel/bengkel', {
        bengkel: bengkel,
        title: 'Data Bengkel',
        desc: 'Ini adalah data cabang bengkel yang dimiliki.',
      })
    })
  })
  app.get('/bengkel-tambah', (req, res) => {
    res.render('bengkel/bengkel-tambah')
  })
  app.post('/bengkel-tambah', upload.single('gambar'), (req, res) => {
    const nama = req.body.nama
    const alamat = req.body.alamat
    const gambar = req.file.filename

    const insertBengkelQuery = `INSERT INTO bengkel VALUES (NULL, '${nama}', '${alamat}', '${gambar}');`
    db.query(insertBengkelQuery, (err, result) => {
      if (err) throw err
      res.redirect('/bengkel')
    })
  })
  app.post('/bengkel-ubah/:id', upload.single('gambar'), (req, res) => {
    const id = req.params.id
    const nama = req.body.nama
    const alamat = req.body.alamat
    const gambar = req.file.filename

    const updateBengkelQuery = `UPDATE bengkel SET nama_bengkel = '${nama}', alamat = '${alamat}', foto_bengkel = '${gambar}' WHERE id_bengkel = '${id}';`
    db.query(updateBengkelQuery, (err, result) => {
      if (err) throw err
      res.redirect('/bengkel')
    })
  })
  app.delete('/bengkel/:id', (req, res) => {
    const id = req.params.id

    console.log('DELETE request received for ID:', id)

    const deleteBengkelQuery = `DELETE FROM bengkel WHERE id_bengkel = '${id}';`
    db.query(deleteBengkelQuery, (err, result) => {
      if (err) throw err
      res.redirect('/bengkel')
    })
  })
  app.get('/bengkel-ubah/:id', (req, res) => {
    const id = req.params.id
    const getBengkelQuery = `SELECT * FROM bengkel WHERE id_bengkel = '${id}';`

    db.query(getBengkelQuery, (err, result) => {
      if (err) throw err
      const bengkel = result[0]
      res.render('bengkel/bengkel-ubah', { bengkel })
    })
  })

  //HANDLER MOTOR
  app.get('/motor', (req, res) => {
    const motorQuery =
      'SELECT * FROM motor JOIN pelanggan on motor.id_pelanggan = pelanggan.id'
    db.query(motorQuery, (err, results) => {
      const motor = JSON.parse(JSON.stringify(results))
      console.log('return motor data: ', motor)
      res.render('motor/motor', {
        motor: motor,
        title: 'Data Motor Pelanggan',
        desc: 'Halaman pengelolaan motor milik pelanggan',
      })
    })
  })
  app.get('/motor-ubah/:nopolisi', (req, res) => {
    const id = req.params.nopolisi
    const getMotorQuery = `SELECT * FROM motor WHERE nopolisi = '${id}';`
    const getPelangganOptions = `SELECT id, username FROM pelanggan;`

    db.query(getMotorQuery, (err, resultMotor) => {
      if (err) throw err
      db.query(getPelangganOptions, (err, resultPelangganOptions) => {
        if (err) throw err
        const motor = resultMotor[0]
        const pelangganOptions = resultPelangganOptions
        res.render('motor/motor-ubah', { motor, pelangganOptions })
      })
    })
  })
  app.post('/motor-ubah/:nopolisi', (req, res) => {
    const nopolisi = req.params.nopolisi
    const tahun = req.body.tahun
    const tipe = req.body.tipe
    const warna = req.body.warna
    const id_pelanggan = req.body.id_pelanggan

    const updateMotorQuery = `UPDATE motor SET tahun = '${tahun}', tipe = '${tipe}', warna = '${warna}', id_pelanggan = '${id_pelanggan}' WHERE nopolisi = '${nopolisi}';`
    db.query(updateMotorQuery, (err, result) => {
      if (err) throw err
      res.redirect('/motor')
    })
  })
  app.delete('/motor/:nopolisi', (req, res) => {
    const nopolisi = req.params.nopolisi

    console.log('DELETE request received for No Polisi:', nopolisi)

    const deleteMotorQuery = `DELETE FROM motor WHERE nopolisi = '${nopolisi}';`
    db.query(deleteMotorQuery, (err, result) => {
      if (err) throw err
      res.redirect('/motor')
    })
  })

  //HANDLER LAYANAN
  app.get('/layanan', (req, res) => {
    const layananQuery = 'SELECT * FROM layanan'
    db.query(layananQuery, (err, results) => {
      const layanan = JSON.parse(JSON.stringify(results))
      console.log('return layanan data: ', layanan)
      res.render('layanan/layanan', {
        layanan: layanan,
        title: 'Data Layanan',
        desc: 'Ini adalah data Layanan yang disediakan oleh Bengkel',
      })
    })
  })
  app.get('/layanan-tambah', (req, res) => {
    res.render('layanan/layanan-tambah')
  })
  app.post('/layanan-tambah', upload.single('gambar'), (req, res) => {
    const nama = req.body.nama
    const gambar = req.file.filename

    const insertLayananQuery = `INSERT INTO layanan VALUES (NULL, '${nama}', '${gambar}');`
    db.query(insertLayananQuery, (err, result) => {
      if (err) throw err
      res.redirect('/layanan')
    })
  })
  app.get('/layanan-ubah/:id', (req, res) => {
    const id = req.params.id
    const getLayananQuery = `SELECT * FROM layanan WHERE id_layanan = '${id}';`

    db.query(getLayananQuery, (err, result) => {
      if (err) throw err
      const layanan = result[0]
      res.render('layanan/layanan-ubah', { layanan })
    })
  })
  app.post('/layanan-ubah/:id', upload.single('gambar'), (req, res) => {
    const id = req.params.id
    const nama = req.body.nama
    const gambar = req.file.filename

    const updateBengkelQuery = `UPDATE layanan SET nama_layanan = '${nama}', gambar_layanan = '${gambar}' WHERE id_layanan = '${id}';`
    db.query(updateBengkelQuery, (err, result) => {
      if (err) throw err
      res.redirect('/layanan')
    })
  })
  app.delete('/layanan/:id', (req, res) => {
    const id = req.params.id

    console.log('DELETE request received for ID:', id)

    const deleteLayananQuery = `DELETE FROM layanan WHERE id_layanan = '${id}';`
    db.query(deleteLayananQuery, (err, result) => {
      if (err) throw err
      res.redirect('/layanan')
    })
  })

  app.get('/antrian', (req, res) => {
    const antrianQuery =
      'SELECT * FROM antrian a JOIN bengkel b ON a.id_bengkel = b.id_bengkel JOIN layanan l ON a.id_layanan = l.id_layanan JOIN motor m ON a.nopolisi = m.nopolisi JOIN pelanggan p ON p.id = m.id_pelanggan'
    db.query(antrianQuery, (err, results) => {
      const antrian = JSON.parse(JSON.stringify(results))
      console.log('return antrian data: ', antrian)
      res.render('antrian/antrian', {
        antrian: antrian,
        title: 'Data Antrian Pelanggan',
      })
    })
  })
})

app.listen(8000, () => {
  console.log('Server Ready')
})
