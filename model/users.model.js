const { Schema, model } = require('mongoose')

const userSchema = new Schema({
    name: {
        type: String,
    },
    pin_code: {
        type: String
    },
    rfid_code: {
        type: String
    }
}, {
    timestamps: true,
    versionKey: false
})

const accessLogSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    access_time: {
        type: Date
    },
    access_type: {
        type: String
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = {
    user: model('users', userSchema),
    accessLog: model('accessLogs', accessLogSchema),
}