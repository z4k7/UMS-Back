const mongoose = require('mongoose')
require('dotenv').config()

const mongoConnect = () => mongoose.connect(process.env.MONGO_URL,console.log('Database Connected'))

module.exports = {mongoConnect}