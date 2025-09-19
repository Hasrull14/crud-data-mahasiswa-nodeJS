//<npm>
const express = require("express");
const expressLayouts = require("express-ejs-layouts"); //middleware npm

//method-override adalah middleware di Express yang memungkinkan kamu memakai HTTP method selain GET dan POST (misalnya PUT, PATCH, DELETE) lewat form HTML biasa.
const methodOverride = require("method-override");

//membuat flash messages
const session = require("express-session");

//express-validator //middleware npm
const { body, validationResult, check } = require("express-validator");
//</npm>

//setup express
const app = express();
const port = 3000;

//setup override // override with POST having ?_method=DELETE
app.use(methodOverride("_method"));

//Setup EJS
//menggunakan view engine ejs
app.set("view engine", "ejs");
//Third-party-middleware
//1. meggunakan express-ejs-layouts
app.use(expressLayouts);
//express built-in-middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); //memparsing data yang dikirim lewat method post, agar bisa digunakan

//connect DB
require("./utils/db");
//model contact
const Biodata = require("./models/contact");

// Middleware session
app.use(
  session({
    secret: "rahasia123", // ubah sesuai kebutuhan
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware flash sederhana
app.use((req, res, next) => {
  res.locals.flash = req.session.flash; // ambil pesan di session
  delete req.session.flash; // hapus setelah diambil (biar sekali pakai)
  next();
});

//Membuat Route URL
//Halaman Home
app.get("/", (req, res) => {
  res.render("index", {
    //rendered html string
    nama: "hasrul",
    title: "Home Page",
    layout: "layouts/main-layouts",
  });
});

//halaman about
app.get("/about", (req, res, next) => {
  const partners = [
    { nama: "Elon Musk", company: "Space X" },
    { nama: "Bill Gates", company: "Microsoft" },
    { nama: "Vladimir Putin", company: "Russia's Missile" },
  ];
  res.render("about", {
    title: "about",
    layout: "layouts/main-layouts",
    namaLengkap: "M Hasrul W.L.Y.D.N",
    partners,
  });
  //next(); //akan pindah ke middleware yang 404, jadi kita gak butuh next disini
});

//halaman contact
app.get("/contact", async (req, res) => {
  //debug
  // Contact.find().then((contact) => {
  //     res.send(contact)
  // })

  //Notes : Contact.find() (dan hampir semua method query di Mongoose) akan mengembalikan Promise.
  const contacts = await Biodata.find(); //method ini masih berbentuk promise, maka harus kita tunggu / await
  res.render("contact", {
    title: "contact",
    layout: "layouts/main-layouts",
    contacts,
  });
});

//halaman form tambah data contact
app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Form Tambah Data Contact",
    layout: "layouts/main-layouts",
  });
});

//proses tambah data contact
app.post(
  "/contact",
  [
    body("npm").custom(async (value) => {
      //custom validasi
      const duplikat = await Biodata.findOne({ npm: value });
      if (duplikat) {
        throw new Error("NPM sudah digunakan"); //return untuk error
      }
      return true;
    }),
    body("npm").custom((value) => {
      if (value.length !== 10) {
        throw new Error("NPM tidak valid masukkan 10 angka");
      }
      return true;
    }),
    check("nohp", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    //custom pesan error, dengan .withMessage('...') atau parameter kedua setelah nama elemen, body('nohp','...')
    //body('nama'), harus sama dengan name di form html
    //console.log(req.body); //req.body, cara menangkap data form yang dikirim, tapi data harus di parsing terlebih dulu sebelum bisa digunakan menggunakan middleware urlencoded()
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //return res.status(400).json({ errors: errors.array() });//debug
      res.render("add-contact", {
        title: "Form Tambah Data Contact",
        layout: "layouts/main-layouts",
        errors: errors.array(),
      }); //errors.array() mengembalikan array yang berisi {
      //   "type": "field",
      //   "value": "1234567890",
      //   "msg": "NPM sudah digunakan",
      //   "path": "npm",
      //   "location": "body"
      // } merupakan hasil dari package express-validator
    } else {
      try {
        await Biodata.insertOne(req.body);
        // Simpan pesan ke session
        req.session.flash = {
          type: "success",
          message: "Kontak berhasil ditambahkan!",
        };
        res.redirect("/contact"); //kembali kehalaman contact
      } catch (error) {
        console.log(error);
        res.redirect("/contact");
      }
    }
  }
);

//proses delete contact with app.delete
app.delete("/contact", async (req, res) => {
  try {
    await Biodata.deleteOne({ _id: req.body.id });
    req.session.flash = { type: "danger", message: "Kontak berhasil dihapus!" };
    res.redirect("/contact");
  } catch (error) {
    console.log(error);
    req.redirect("/contact");
  }
});

//halaman form edit data contact
app.get("/contact/edit/:id", async (req, res) => {
  try {
    const contact = await Biodata.findOne({ _id: req.params.id });

    res.render("edit-contact", {
      title: "Form Ubah Data Contact",
      layout: "layouts/main-layouts",
      contact,
    });
  } catch (error) {
    //res.send(alert(error.message))
    res.status(404).send("Maaf data yang anda cari tidak ada!");
  }
});

//proses ubah data
app.put(
  "/contact",
  [
    body("npm").custom(async (value, { req }) => {
      //custom validasi
      const duplikat = await Biodata.findOne({ npm: value });
      if (value !== req.body.oldnpm && duplikat) {
        throw new Error("npm sudah digunakan"); //throw, adalah return error
      }
      return true;
    }),
    body("npm").custom((value) => {
      if (value.length !== 10) {
        throw new Error("NPM tidak valid masukkan 10 angka");
      }
      return true;
    }),
    check("nohp", "nohp tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    //custom pesan error, dengan .withMessage('...') atau parameter kedua setelah nama elemen, body('nohp','...')
    //body('nama'), harus sama dengan name di form html
    //console.log(req.body); //req.body, cara menangkap data form yang dikirim, tapi data harus di parsing terlebih dulu sebelum bisa digunakan menggunakan middleware urlencoded()

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //return res.status(400).json({ errors: errors.array() }); //debug
      res.render("edit-contact", {
        title: "Form Edit Data Contact",
        layout: "layouts/main-layouts",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      try {
        await Biodata.updateOne(
          { _id: req.body._id },
          {
            $set: {
              nama: req.body.nama,
              npm: req.body.email,
              nohp: req.body.nohp,
            },
          }
        );
        console.log(req.body);
        res.redirect("/contact"); //kembali kehalaman contact
      } catch (error) {
        console.log(error);
        res.redirect("/contact");
      }
    }
  }
);

//halaman detail contact
app.get("/contact/:id", async (req, res) => {
  try {
    // /:nama, sebuah placeholder untuk menyimpan nilai dibelakang route contact/
    //const contact = findContact(req.params.id);
    const contact = await Biodata.findOne({ _id: req.params.id });

    console.log(contact);
    res.render("detail", {
      title: "Halaman Detail Contact",
      layout: "layouts/main-layouts",
      contact,
    });
  } catch (error) {
    res.status(400).send(error.message)
  }
});

//halaman menampilkan data contact yang dicari
app.post("/cari", async (req, res) => {
  try {
    const namaInput = req.body.nama?.trim(); // hapus spasi biar rapi

    // kondisi 1: input kosong
    if (!namaInput) {
      throw new Error("Nama harus diisi untuk melakukan pencarian!");
    }

    const query = { nama: { $regex: req.body.nama, $options: "i" } };
    const sortFields = { nama: 1 };
    const contacts = await Biodata.find(query).sort(sortFields);

    // kondisi 2: input ada tapi tidak ditemukan di DB
    if (contacts.length === 0) {
      throw new Error(`Mahasiswa dengan nama "${namaInput}" tidak ditemukan!`);
    }

    res.render("contact", {
      title: "Form Cari Data Mahasiswa",
      layout: "layouts/main-layouts",
      contacts,
    });
  } catch (error) {
    console.log(error);
    //res.send(alert(error.message))
    req.session.flash = { type: "danger", message: error.message }; //.message menangkap nilai dari objek error
    res.redirect("/contact");
  }
});

//sort a-z
app.get("/sorting", async (req, res) => {
  try {
    //cara 1
    // let sortFields = {};
    // if (req.query.sort === "asc") {
    //   sortFields = { nama: 1 };
    // } else if (req.query.sort === "desc") {
    //   sortFields = { nama: -1 };
    // } else {
    //   res.send("Apa Lo");
    // }

    //cara 2 lebih singkat
    // ambil sort dari query
    let sort = req.query.sort === "desc" ? "desc" : "asc";
    // tentukan arah sort MongoDB
    const sortFields = { nama: sort === "asc" ? 1 : -1 };

    const contacts = await Biodata.find()
      .collation({ locale: "en", strength: 1 })
      .sort(sortFields);
    console.log(contacts);
    res.render("contact", {
      title: "Form Cari Data Mahasiswa",
      layout: "layouts/main-layouts",
      contacts,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//Mounts the specified middleware function or functions at the specified path: the middleware function is executed when the base of the requested path matches path.
app.use("/", (req, res) => {
  //fungsi middleware ini akan selalu dijalankan ketika routenya "/"
  res.status(404);
  res.send("<h1>Page Not Found 404!</h1>");
});

app.listen(port, () => {
  console.log(`Mongo Contact App | listening at http://localhost:${port}`);
});
