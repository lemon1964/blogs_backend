require('dotenv').config()
const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const url = process.env.MONGODB_URI

mongoose.set('strictQuery', false)

mongoose.connect(url).catch((error) => {
  console.error('Error connecting to MongoDB:', error)
})

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    minLength: 5,
    required: true,
    unique: true
  },
  author: {
    type: String,
    required: true
  },
  url: {
    type: String,
  },
  likes: {
    type: Number,
    default: 0
  },
})

const Blog = mongoose.model('Blog', blogSchema)

if (process.argv.length === 7) {
  const blog = new Blog({
    title: process.argv[3],
    author: process.argv[4],
    url: process.argv[5],
    likes: process.argv[6],
  })

  blog.save()
    .then((result) => {
      console.log('added blog:', result.title, result.author)
      mongoose.connection.close()
    })
    .catch((error) => {
      console.error('Error saving blog to MongoDB:', error)
      mongoose.connection.close()
    })
} else if (process.argv.length === 3) {
  Blog.find({})
    .then((result) => {
      console.log('all blogs:')
      result.forEach((blog) => {
        console.log(blog.title, blog.author)
      })
      mongoose.connection.close()
    })
    .catch((error) => {
      console.error('Error retrieving blogs from MongoDB:', error)
      mongoose.connection.close()
    })
} else {
  console.log('Invalid number of arguments')
  mongoose.connection.close()
}
