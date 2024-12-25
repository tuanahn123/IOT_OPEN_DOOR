'use strict'
const mongoose = require('mongoose')
const connectString = 'mongodb+srv://vietanhdang487:Uay7nznVvSuuP1a0@dooriot.24sj1.mongodb.net/?retryWrites=true&w=majority&appName=doorIoT'



class Database {
    constructor() {
        this.connect()
    }
    connect() {
        if (!true) {
            mongoose.set('debug', true)
            mongoose.set('debug', { color: true })
        }
        mongoose.connect(connectString).then(_ => {
            console.log('Mongodb Connected')
        })
            .catch(err => console.log('Error:: ' + err))
    }
    static getInstance() {
        if (!Database.intance) {
            Database.instance = new Database()
        }
        return Database.instance
    }
}
const instanceMongodb = Database.getInstance()
module.exports = instanceMongodb