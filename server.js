const express = require('express')
const session = require('express-session')
const flash = require('express-flash')
const mysql = require('mysql')
const BodyParser = require('body-parser')
const bcrypt = require('bcrypt')
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

app.use(express.urlencoded({ extended: false }))
app.use(BodyParser.urlencoded({ extended: true }))
app.use(express.static('assets'))
app.use('/assets/uploads', express.static('assets/uploads'))
app.use(express.json())
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
)
app.use(flash())
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

  //HANDLER REGISTER ADMIN
  app.get('/register-admin', (req, res) => {
    res.render('admin/register', { flash: req.flash('error') })
  })

  app.post('/register-admin', (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const checkUsernameQuery =
      'SELECT COUNT(*) AS count FROM admin WHERE username = ?'
    // USERNAME VALIDATION USING FLASH MESSAGE
    db.query(checkUsernameQuery, [username], (err, result) => {
      if (err) {
        throw err
      }
      const isUsernameTaken = result[0].count > 0
      if (isUsernameTaken) {
        req.flash(
          'error',
          'Username sudah terdaftar. Login atau isi username lain.'
        )
        return res.redirect('/register-admin')
      } else {
        const saltRounds = 10
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (err) {
            console.error('Error hashing password: ', err)
            return res.send('An error occurred during registration.')
          }
          const insertLayananQuery = `INSERT INTO admin VALUES (NULL, '${username}', '${hash}');`
          db.query(insertLayananQuery, (err, result) => {
            if (err) throw err
            res.redirect(`/login-admin`)
          })
        })
      }
    })
  })

  //HANDLER LOGIN ADMIN
  app.get('/login-admin', (req, res) => {
    res.render('admin/login', { flash: req.flash('error') })
  })
  app.post('/login-admin', (req, res) => {
    const { username, password } = req.body

    // Query ke database untuk mencari data pengguna berdasarkan username
    const query = 'SELECT * FROM admin WHERE username = ?'
    db.query(query, [username], (err, result) => {
      if (err) {
        console.error('Error querying database: ', err)
        return res.send('An error occurred during login.')
      }

      // Cek apakah data pengguna ditemukan
      if (result.length === 0) {
        req.flash('error', 'Username not found.')
        return res.redirect('/login-admin')
      }

      // Bandingkan password yang dimasukkan dengan password di database
      const user = result[0]
      bcrypt.compare(password, user.password, (error, isMatch) => {
        if (error) {
          console.error('Error comparing passwords: ', error)
          return res.send('An error occurred during login.')
        }

        if (isMatch) {
          // Jika password cocok, simpan data pengguna dalam sesi
          req.session.user = {
            id: user.id,
            username: user.username,
            // tambahkan data lainnya yang ingin disimpan dalam sesi
          }
          return res.redirect('/dashboard') // Ganti dengan halaman setelah login berhasil
        } else {
          req.flash('error', 'Invalid password.')
          return res.redirect('/login-admin')
        }
      })
    })
  })

  const requireLoginAdmin = (req, res, next) => {
    if (req.session.user) {
      // Pengguna sudah login, lanjutkan ke halaman yang diakses
      next()
    } else {
      // Pengguna belum login, arahkan ke halaman login
      res.redirect('/login-admin')
    }
  }

  // HANDLER DASHBOARD ADMIN
  app.get('/dashboard', requireLoginAdmin, (req, res) => {
    res.render('admin/dashboard')
  })

  // HANDLER PELANGGAN
  app.get('/pelanggan', requireLoginAdmin, (req, res) => {
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
  app.get('/pelanggan-ubah/:id', requireLoginAdmin, (req, res) => {
    const id = req.params.id
    const getPelangganQuery = `SELECT * FROM pelanggan WHERE id = '${id}';`
    console.log(req.body.username)

    db.query(getPelangganQuery, (err, result) => {
      if (err) throw err
      const pelanggan = result[0]
      res.render('pelanggan/pelanggan-ubah', { pelanggan })
    })
  })
  app.post('/pelanggan-ubah/:id', requireLoginAdmin, (req, res) => {
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
  app.delete('/pelanggan/:id', requireLoginAdmin, (req, res) => {
    const id = req.params.id

    console.log('DELETE request received for ID:', id)

    const deletePelangganQuery = `DELETE FROM pelanggan WHERE id = '${id}';`
    db.query(deletePelangganQuery, (err, result) => {
      if (err) throw err
      res.redirect('/pelanggan')
    })
  })

  // HANDLER BENGKEL
  app.get('/bengkel', requireLoginAdmin, (req, res) => {
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
  app.get('/bengkel-tambah', requireLoginAdmin, (req, res) => {
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
  app.post(
    '/bengkel-ubah/:id',
    requireLoginAdmin,
    upload.single('gambar'),
    (req, res) => {
      const id = req.params.id
      const nama = req.body.nama
      const alamat = req.body.alamat
      const gambar = req.file.filename

      const updateBengkelQuery = `UPDATE bengkel SET nama_bengkel = '${nama}', alamat = '${alamat}', foto_bengkel = '${gambar}' WHERE id_bengkel = '${id}';`
      db.query(updateBengkelQuery, (err, result) => {
        if (err) throw err
        res.redirect('/bengkel')
      })
    }
  )
  app.delete('/bengkel/:id', requireLoginAdmin, (req, res) => {
    const id = req.params.id

    console.log('DELETE request received for ID:', id)

    const deleteBengkelQuery = `DELETE FROM bengkel WHERE id_bengkel = '${id}';`
    db.query(deleteBengkelQuery, (err, result) => {
      if (err) throw err
      res.redirect('/bengkel')
    })
  })
  app.get('/bengkel-ubah/:id', requireLoginAdmin, (req, res) => {
    const id = req.params.id
    const getBengkelQuery = `SELECT * FROM bengkel WHERE id_bengkel = '${id}';`

    db.query(getBengkelQuery, (err, result) => {
      if (err) throw err
      const bengkel = result[0]
      res.render('bengkel/bengkel-ubah', { bengkel })
    })
  })

  //HANDLER MOTOR
  app.get('/motor', requireLoginAdmin, (req, res) => {
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
  app.get('/motor-ubah/:nopolisi', requireLoginAdmin, (req, res) => {
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
  app.post('/motor-ubah/:nopolisi', requireLoginAdmin, (req, res) => {
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
  app.delete('/motor/:nopolisi', requireLoginAdmin, (req, res) => {
    const nopolisi = req.params.nopolisi

    console.log('DELETE request received for No Polisi:', nopolisi)

    const deleteMotorQuery = `DELETE FROM motor WHERE nopolisi = '${nopolisi}';`
    db.query(deleteMotorQuery, (err, result) => {
      if (err) throw err
      res.redirect('/motor')
    })
  })

  //HANDLER LAYANAN
  app.get('/layanan', requireLoginAdmin, (req, res) => {
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
  app.get('/layanan-tambah', requireLoginAdmin, (req, res) => {
    res.render('layanan/layanan-tambah')
  })
  app.post(
    '/layanan-tambah',
    requireLoginAdmin,
    upload.single('gambar'),
    (req, res) => {
      const nama = req.body.nama
      const gambar = req.file.filename

      const insertLayananQuery = `INSERT INTO layanan VALUES (NULL, '${nama}', '${gambar}');`
      db.query(insertLayananQuery, (err, result) => {
        if (err) throw err
        res.redirect('/layanan')
      })
    }
  )
  app.get('/layanan-ubah/:id', requireLoginAdmin, (req, res) => {
    const id = req.params.id
    const getLayananQuery = `SELECT * FROM layanan WHERE id_layanan = '${id}';`

    db.query(getLayananQuery, (err, result) => {
      if (err) throw err
      const layanan = result[0]
      res.render('layanan/layanan-ubah', { layanan })
    })
  })
  app.post(
    '/layanan-ubah/:id',
    requireLoginAdmin,
    upload.single('gambar'),
    (req, res) => {
      const id = req.params.id
      const nama = req.body.nama
      const gambar = req.file.filename

      const updateBengkelQuery = `UPDATE layanan SET nama_layanan = '${nama}', gambar_layanan = '${gambar}' WHERE id_layanan = '${id}';`
      db.query(updateBengkelQuery, (err, result) => {
        if (err) throw err
        res.redirect('/layanan')
      })
    }
  )
  app.delete('/layanan/:id', requireLoginAdmin, (req, res) => {
    const id = req.params.id

    console.log('DELETE request received for ID:', id)

    const deleteLayananQuery = `DELETE FROM layanan WHERE id_layanan = '${id}';`
    db.query(deleteLayananQuery, (err, result) => {
      if (err) throw err
      res.redirect('/layanan')
    })
  })

  app.get('/antrian', requireLoginAdmin, (req, res) => {
    const antrianQuery =
      'SELECT * FROM antrian a JOIN bengkel b ON a.id_bengkel = b.id_bengkel JOIN layanan l ON a.id_layanan = l.id_layanan JOIN motor m ON a.nopolisi = m.nopolisi JOIN pelanggan p ON p.id = m.id_pelanggan'
    db.query(antrianQuery, (err, results) => {
      const antrian = JSON.parse(JSON.stringify(results))
      console.log('return antrian data: ', antrian)
      res.render('antrian/antrian', {
        antrian: antrian,
        title: 'Data Antrian Pelanggan',
        desc: 'Antrian yang dilakukan pelanggan',
      })
    })
  })
  app.get('/antrian-ubah/:id', requireLoginAdmin, (req, res) => {
    const id = req.params.id
    const getAntrianQuery = `SELECT * FROM antrian WHERE id_antrian = '${id}';`
    const getBengkelQuery = `SELECT id_bengkel, nama_bengkel FROM bengkel`
    const getLayananQuery = `SELECT id_layanan, nama_layanan FROM layanan`
    const getMotorQuery = `SELECT nopolisi FROM motor`

    db.query(getAntrianQuery, (err, resultAntrian) => {
      if (err) throw err
      db.query(getBengkelQuery, (err, resultBengkel) => {
        if (err) throw err
        db.query(getLayananQuery, (err, resultLayanan) => {
          if (err) throw err
          db.query(getMotorQuery, (err, resultMotor) => {
            if (err) throw err

            const antrian = resultAntrian[0]
            const bengkel = resultBengkel
            const layanan = resultLayanan
            const motor = resultMotor

            res.render('antrian/antrian-ubah', {
              antrian,
              bengkel,
              layanan,
              motor,
            })
          })
        })
      })
    })
  })
  app.post('/antrian-ubah/:id', requireLoginAdmin, (req, res) => {
    const id = req.params.id
    const nopolisi = req.body.nopolisi
    const id_bengkel = req.body.id_bengkel
    const id_layanan = req.body.id_layanan
    const keluhan = req.body.keluhan

    const updateAntrianQuery = `UPDATE antrian SET nopolisi = '${nopolisi}', id_bengkel = '${id_bengkel}', id_layanan = '${id_layanan}', keluhan = '${keluhan}' WHERE id_antrian= '${id}';`
    db.query(updateAntrianQuery, (err, result) => {
      if (err) throw err
      res.redirect('/antrian')
    })
  })
  app.delete('/antrian/:id', requireLoginAdmin, (req, res) => {
    const id = req.params.id

    console.log('DELETE request received for ID:', id)

    const deleteLayananQuery = `DELETE FROM antrian WHERE id_antrian = '${id}';`
    db.query(deleteLayananQuery, (err, result) => {
      if (err) throw err
      res.redirect('/antrian')
    })
  })

  //HANDLER REGISTER
  app.get('/register', (req, res) => {
    res.render('user/register', { flash: req.flash('error') })
  })

  app.post('/register-pelanggan', (req, res) => {
    const username = req.body.username
    const no_telepon = req.body.no_telepon
    const alamat = req.body.alamat
    const password = req.body.password
    const checkUsernameQuery =
      'SELECT COUNT(*) AS count FROM pelanggan WHERE username = ?'
    // USERNAME VALIDATION USING FLASH MESSAGE
    db.query(checkUsernameQuery, [username], (err, result) => {
      if (err) {
        throw err
      }
      const isUsernameTaken = result[0].count > 0
      if (isUsernameTaken) {
        req.flash(
          'error',
          'Username sudah terdaftar. Login atau isi username lain.'
        )
        return res.redirect('/register')
      } else {
        const saltRounds = 10
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (err) {
            console.error('Error hashing password: ', err)
            return res.send('An error occurred during registration.')
          }
          const insertLayananQuery = `INSERT INTO pelanggan VALUES (NULL, '${username}', '${hash}', '${no_telepon}', '${alamat}');`
          db.query(insertLayananQuery, (err, result) => {
            if (err) throw err
            res.redirect(`/login`)
          })
        })
      }
    })
  })

  //HANDLER LOGIN PELANGGAN
  app.get('/login', (req, res) => {
    res.render('user/login', { flash: req.flash('error') })
  })
  app.post('/login', (req, res) => {
    const { username, password } = req.body

    // Query ke database untuk mencari data pengguna berdasarkan username
    const query = 'SELECT * FROM pelanggan WHERE username = ?'
    db.query(query, [username], (err, result) => {
      if (err) {
        console.error('Error querying database: ', err)
        return res.send('An error occurred during login.')
      }

      // Cek apakah data pengguna ditemukan
      if (result.length === 0) {
        req.flash('error', 'Username not found.')
        return res.redirect('/login')
      }

      // Bandingkan password yang dimasukkan dengan password di database
      const user = result[0]
      bcrypt.compare(password, user.password, (error, isMatch) => {
        if (error) {
          console.error('Error comparing passwords: ', error)
          return res.send('An error occurred during login.')
        }

        if (isMatch) {
          // Jika password cocok, simpan data pengguna dalam sesi
          req.session.user = {
            id: user.id,
            username: user.username,
            no_telepon: user.no_telepon,
            // tambahkan data lainnya yang ingin disimpan dalam sesi
          }
          return res.redirect('/home') // Ganti dengan halaman setelah login berhasil
        } else {
          req.flash('error', 'Invalid password.')
          return res.redirect('/login')
        }
      })
    })
  })

  // Middleware untuk memeriksa apakah pengguna sudah login
  const requireLogin = (req, res, next) => {
    if (req.session.user) {
      // Pengguna sudah login, lanjutkan ke halaman yang diakses
      next()
    } else {
      // Pengguna belum login, arahkan ke halaman login
      res.redirect('/login')
    }
  }

  // Route untuk halaman setelah login berhasil (dashboard, contohnya)
  app.get('/home', requireLogin, (req, res) => {
    // Ambil data pelanggan dari sesi untuk keperluan tertentu
    const user = req.session.user
    res.render('user/home', { user })
  })

  //HANDLER BOOKING PELANGGAN
  app.get('/booking', requireLogin, (req, res) => {
    const user = req.session.user
    const getBengkelQuery = `SELECT * FROM bengkel`
    const getLayananQuery = `SELECT * FROM layanan`

    db.query(getBengkelQuery, (err, resultBengkelQuery) => {
      db.query(getLayananQuery, (err, resultLayananQuery) => {
        const bengkel = resultBengkelQuery
        const layanan = resultLayananQuery
        res.render('user/booking', { user, layanan, bengkel })
      })
    })
  })

  app.post('/booking-pelanggan', requireLogin, (req, res) => {
    const id_pelanggan = req.session.user.id
    const id_bengkel = req.body.id_bengkel
    const id_layanan = req.body.id_layanan
    const nopolisi = req.body.nopolisi
    const tahun = req.body.tahun
    const tipe = req.body.tipe
    const warna = req.body.warna
    const keluhan = req.body.keluhan
    const tanggal_booking = req.body.tanggal_booking
    const waktu_booking = req.body.waktu_booking

    const insertMotorQuery = `INSERT INTO motor VALUES ('${nopolisi}', '${tahun}', '${tipe}', '${warna}', '${id_pelanggan}');`
    db.query(insertMotorQuery, (err, result) => {
      if (err) throw err
      const insertAntrianQuery = `INSERT INTO antrian VALUES (NULL, '${nopolisi}', '${id_bengkel}', '${id_layanan}', '${keluhan}', '${tanggal_booking}', '${waktu_booking}', NULL) `
      db.query(insertAntrianQuery, (err, result) => {
        if (err) throw err
        req.flash('success', 'Booking Berhasil Dilakukan')
        return res.redirect('/riwayat')
      })
    })
  })

  //HANDLER RIWAYAT
  app.get('/riwayat', requireLogin, (req, res) => {
    const id = req.session.user.id
    const user = req.session.user
    const getAntrianQuery = `SELECT * FROM antrian a JOIN motor m ON a.nopolisi = m.nopolisi JOIN bengkel b ON a.id_bengkel = b.id_bengkel JOIN layanan l ON a.id_layanan = l.id_layanan JOIN pelanggan p ON p.id = m.id_pelanggan WHERE p.id = '${id}'`
    db.query(getAntrianQuery, (err, resultAntrianQuery) => {
      if (err) throw err
      resultAntrianQuery.forEach((antrian) => {
        const waktuBooking = new Date(antrian.waktu_transaksi)
        const tanggalKedatangan = new Date(antrian.tanggal_booking)
        antrian.waktuBooking = waktuBooking.toLocaleString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        antrian.tanggalKedatangan = tanggalKedatangan.toLocaleString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      })
      res.render('user/riwayat-booking', {
        user,
        antrian: resultAntrianQuery,
        flash: req.flash('success'),
      })
    })
  })

  //HANDLER LOGOUT
  app.get('/logout', (req, res) => {
    // Hapus sesi pengguna
    req.session.destroy((err) => {
      if (err) {
        console.log('Error while destroying session:', err)
      }
      // Redirect ke halaman login setelah logout
      res.redirect('/login')
    })
  })

  //HANDLER LOGOUT
  app.get('/logout-admin', (req, res) => {
    // Hapus sesi pengguna
    req.session.destroy((err) => {
      if (err) {
        console.log('Error while destroying session:', err)
      }
      // Redirect ke halaman login setelah logout
      res.redirect('/login-admin')
    })
  })
})

app.listen(8000, () => {
  console.log('Server Ready')
})
