const mongoose = require("mongoose");

const Biodata = mongoose.model("Student", {
  nama: {
    type: String,
    required: true,
  },
  nohp: {
    type: String,
    required: true,
  },
  npm: {
    type: String,
  },
});

// mencoba menambah 1 data for debug
// const biodata1 = new Biodata({nama: 'hasrul', nohp: '08123233', npm:'2413030096'})

// biodata1.save().then(res => console.log(res))


module.exports = Biodata;