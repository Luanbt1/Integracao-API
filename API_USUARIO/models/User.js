const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: [/.+\@.+\..+/, 'Please enter a valid email address'] },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
