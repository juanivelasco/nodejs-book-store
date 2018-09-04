const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const userUri = encodeURIComponent('wsp');
const passUri = encodeURIComponent('password');
const url = 'mongodb://' + userUri + ':' + passUri + 
            '@localhost:27017/wspdb?authSource=wspdb';

const options = {poolSize: 20};
mongoose.connect(url, options);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
});

// close connection when app terminates
process.on('SIGINT', () => {
    mongoose.connection.close( () => {
        console.log('Mongoose connection closed due to app termination');
        process.exit(0);
    })
});