
class Book {
    constructor(db_entry) {
        this.id = db_entry.id;
        this.author = db_entry.author;
        this.title = db_entry.title;
        this.price = db_entry.price;
        this.cover = db_entry.cover;
    } 
    serialize() {
        return {
            id: this.id,
            author: this.author,
            title: this.title,
            price: this.price,
            cover: this.cover
        };
    }
    static deserialize(sbook) {
        return new Book(
            sbook.id,
            sbook.author,
            sbook.title,
            sbook.price,
            sbook.cover
        );
    }
}

module.exports = Book;