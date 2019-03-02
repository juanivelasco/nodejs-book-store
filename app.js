
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use('/public', express.static(__dirname + '/public'));
app.use(express.urlencoded( {extended: false} ));

app.use(session({
	secret: 'mysecretkey',
	resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 60*60*1000, // if inactive, session expires in 1 hour
        path: '/'
    }
}));

const ShoppingCart = require('./models/ShoppingCart');
const Book = require('./models/Book');
app.locals.store_title = 'Something Different';
const uploadImagePrefix = 'image-';
const uploadDir = 'public/uploads';
// set storage options of multer
const storageOptions = multer.diskStorage({
    destination: (req, file, callback) => {
        // upload dir path
        callback(null, uploadDir);
    },
    filename: (req, file, callback) => {
        callback(null, uploadImagePrefix + Date.now()
            + path.extname(file.originalname));
    }
});

// configure multer
const MAX_FILESIZE = 1024 * 1024 * 3; // 3 MB
const fileTypes = /jpeg|jpg|png|gif/; // accepted file types in regexp

const upload = multer({
    storage: storageOptions,
    limits: {
        fileSize: MAX_FILESIZE
    },
    fileFilter: (req, file, callback) => {
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (mimetype && extname) {
            return callback(null, true);
        } else {
            return callback('Error: Images only');
        }
    }
}).single('image'); // parameter name at <form> of index.ejs


// run and connect to the database
require('./models/database');
const BookSchema = require('./models/bookSchema');


app.get('/', (req, res) => {
    res.render('index');
});

app.get('/shop', (req, res) => {
    if (!req.session.shoppingcart) {
        req.session.shoppingcart = new ShoppingCart().serialize();
    }
    BookSchema.find({}, (err, results) => {
		if (err) {
			return res.render.status(500).send('<h1>Error</h1>');
        }
		return res.render('shop', {results, BookSchema});
	});
});

app.post('/addBook', (req, res) => {
	const book_id = req.body._id;


    BookSchema.findOne({_id: book_id}, (err, result) => {
        if (err) {
            return res.render.status(500).send('<h1>Error</h1>');
        }
        if (!req.session.shoppingcart) {
            req.session.shoppingcart = new ShoppingCart().serialize();
        }
        const buyBook = new Book(result);

        const shoppingcart = ShoppingCart.deserialize(req.session.shoppingcart);
        shoppingcart.add(buyBook);
        req.session.shoppingcart = shoppingcart.serialize();

        res.render('shoppingcart', {shoppingcart});
    });
});

app.get('/checkout', (req, res) => {
    let message = '';
    if (!req.session.shoppingcart) {
        message = "Did't you buy anything yet? Why checkout?";
    } else {

        const shoppingcart = ShoppingCart.deserialize(req.session.shoppingcart);
        res.render('checkout', {shoppingcart});
    }
});

app.get('/admin', (req, res) => {
	BookSchema.find({}, (err, results) => {
		if (err) {
			return res.render.status(500).send('<h1>Error</h1>');
        }
		return res.render('admin', {results, BookSchema});
	});
});

app.get('/add', (req, res) => {
	res.render('add', {msg: null});
});

app.post('/add', (req, res) => {

    upload(req, res, (err) => {
        const newBook = new BookSchema({
             title: req.body.title,
             author: req.body.author,
             price: req.body.price,
             cover: uploadDir + '/' + req.file.filename

        });
        newBook.save((err, results) => {
            if (err) {
                return res.status(500).send('<h1>save() error</h1>', err);
            }
            return res.redirect('/admin');
        });

    });
});

app.get('/update', (req, res) => {

    BookSchema.findById(req.query.bookID, (err, book) => {
		if (err) {
			return res.render.status(500).send('<h1>Error</h1>');
        }
		return res.render('update', {book});
	});

});

const port = process.env.PORT || 3000;
app.listen(port, ()=> {
	console.log('Server started at port', port);
});

app.post('/update', (req, res) => {
    upload(req, res, (err) => {
        let image = req.body.cover;
        if(!req.file) {
        } else {
        fs.unlink(req.body.cover, (err) => {
                 if (err) {

                    throw err;
                }
            });
            image = uploadDir + '/' + req.file.filename;

        }

        const query = {_id: req.body._id};
        const value = {
            $set: {
                title: req.body.title,
                author: req.body.author,
                price: req.body.price,
                cover: image
            }
        };

        BookSchema.findOneAndUpdate(query, value, (err, results) => {
            if (err) {
                return res.status(500).send('<h1>Update Error</h1>');
            }

            return res.redirect('/admin');
        });
    });
});

app.get('/remove', (req, res) => {
	BookSchema.remove({_id: req.query._id}, (err, results) => {
		if (err) {
			return res.status(500).send('<h1>Remove error</h1>');
        }
        fs.unlink(req.query.filename, (err) => {
            if (err) {
                // what should I do?
                throw err;
            }
        });
		return res.redirect('/admin');
	});
});
