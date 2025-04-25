# TypeScript Express API with MongoDB, Mongoose, and Decorators

This project demonstrates how to build a RESTful API using TypeScript, Express, MongoDB, and Mongoose with decorators for clean and maintainable code.

## Features

- TypeScript for type safety
- Express for routing and middleware
- MongoDB with Mongoose for database operations
- Decorators for clean and reusable code
- RESTful API design
- Error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_USER=your_username
MONGODB_PASSWORD=your_password
MONGODB_URL=your_cluster_url
MONGODB_DATABASE=your_database_name
PORT=3000
```

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

## API Endpoints

### Books

- `GET /books/getall` - Get all books
- `GET /books/:id` - Get a specific book by ID
- `POST /books/create` - Create a new book
- `PATCH /books/update/:id` - Update a book
- `DELETE /books/delete/:id` - Delete a book
- `POST /books/query` - Query books based on criteria

## Example Usage

### Create a Book
```bash
curl -X POST http://localhost:3000/books/create \
  -H "Content-Type: application/json" \
  -d '{"title": "The Great Gatsby", "author": "F. Scott Fitzgerald"}'
```

### Get All Books
```bash
curl http://localhost:3000/books/getall
```

### Get a Book by ID
```bash
curl http://localhost:3000/books/60d21b4667d0d8992e610c85
```

### Update a Book
```bash
curl -X PATCH http://localhost:3000/books/update/60d21b4667d0d8992e610c85 \
  -H "Content-Type: application/json" \
  -d '{"title": "The Great Gatsby (Updated)"}'
```

### Delete a Book
```bash
curl -X DELETE http://localhost:3000/books/delete/60d21b4667d0d8992e610c85
```

### Query Books
```bash
curl -X POST http://localhost:3000/books/query \
  -H "Content-Type: application/json" \
  -d '{"author": "F. Scott Fitzgerald"}'
```

## Project Structure

```
src/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── decorators/         # Custom decorators
│   └── mongoose/       # Mongoose-specific decorators
├── middleware/         # Express middleware
├── models/             # Mongoose models
├── routes/             # Express routes
├── types/              # TypeScript type definitions
└── server.ts           # Main application file
```

## License

MIT
