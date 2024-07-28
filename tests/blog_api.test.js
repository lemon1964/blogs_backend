const { test, after, beforeEach, describe  } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('./test_helper')
const jwt = require('jsonwebtoken')
const config = require('../utils/config')
require('events').setMaxListeners(20)  // Increasing listener limit for "creation succeeds with a fresh username" test


describe('Backend testing', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs
      .map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
  })

  describe('all blogs are returned in JSON format and have a unique ID', () => {
    test('blogs are returned as json', async () => {
      await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('all blogs are returned', async () => {
      const response = await api.get('/api/blogs')
      assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })

    test('blog post id is database _id', async () => {
      const response = await api.get('/api/blogs')

      response.body.forEach(blog => {
        assert.strictEqual(blog.id !== undefined, true)
        assert.strictEqual(blog._id, undefined)
      })
    })
  })

  describe('adding, deleting and updating a blog', () => {
    test('adding a valid block with status code 201', async () => {
      await User.deleteMany({})

      const newUser = {
        username: 'bob',
        name: 'pickachu',
        password: 'devil',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      const userInDb = usersAtEnd[0]

      const token = jwt.sign({ username: userInDb.username, id: userInDb.id }, config.SECRET)
      const decodedToken = jwt.verify(token, config.SECRET)

      const user = await User.findOne({ username: decodedToken.username })

      const newBlog = {
        title: 'Testing with Supertest',
        author: 'Supertest',
        url: 'http://www.supertest.com',
        likes: 7,
        user: user._id
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

      const contents = blogsAtEnd.map(n => n.title)
      assert.strictEqual(contents.includes('Testing with Supertest'), true)

      const blog = blogsAtEnd.find(n => n.title === 'Testing with Supertest')
      const userBlog = await User.findById(blog.user)
      // check to ensure the blog has the created user
      assert.strictEqual(blog.user.toString(), userBlog._id.toString())
      // check to ensure the user has the created blog
      assert(userBlog.blogs.map(blogId => blogId.toString()).includes(blog.id.toString()))
    })

    test('adding blog if token not provided'), async () => {
      await User.deleteMany({})

      const newUser = {
        username: 'bob',
        name: 'pickachu',
        password: 'devil',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      const userInDb = usersAtEnd[0]

      const newBlog = {
        title: 'Token is not provided',
        author: 'WrongToken',
        url: 'http://www.wrongtoken.com',
        likes: 7,
        user: userInDb._id
      }

      const result = await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(result.body.error, 'token invalid')
    }

    test('deleted with status code 204 if ID and token are valid', async () => {
      await User.deleteMany({})

      const newUser = {
        username: 'bob',
        name: 'pickachu',
        password: 'devil',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      const userInDb = usersAtEnd[0]

      const token = jwt.sign({ username: userInDb.username, id: userInDb.id }, config.SECRET)
      const decodedToken = jwt.verify(token, config.SECRET)

      const user = await User.findOne({ username: decodedToken.username })

      const newBlog = {
        title: 'Check for blog deletion',
        author: 'Delete',
        url: 'http://www.deletion.com',
        likes: 7,
        user: user._id
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart.find(blog => blog.title === 'Check for blog deletion')

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)

      const title = blogsAtEnd.map(r => r.title)
      assert(!title.includes(blogToDelete.title))
    })

    test('updated with status code 200 if ID and token are valid', async () => {
      await User.deleteMany({})

      const newUser = {
        username: 'bob',
        name: 'pickachu',
        password: 'devil',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      const userInDb = usersAtEnd[0]

      const token = jwt.sign({ username: userInDb.username, id: userInDb.id }, config.SECRET)
      const decodedToken = jwt.verify(token, config.SECRET)

      const user = await User.findOne({ username: decodedToken.username })

      const newBlog = {
        title: 'Check for blog update',
        author: 'Update',
        url: 'http://www.update.com',
        likes: 7,
        user: user._id
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart.find(blog => blog.title === 'Check for blog update')

      const updatedBlog = {
        title: blogToUpdate.title,
        author: blogToUpdate.author,
        url: blogToUpdate.url,
        likes: blogToUpdate.likes + 3,
      }

      const result = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

      const likes = blogsAtEnd.map(r => r.likes)
      assert(likes.includes(blogToUpdate.likes + 3))
      assert.strictEqual(result.body.likes, updatedBlog.likes)
    })
  })

  describe('if queries are missing fields', () => {
    test('if likes is missing, default value is 0', async () => {
      await User.deleteMany({})

      const newUser = {
        username: 'bob',
        name: 'pickachu',
        password: 'devil',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      const userInDb = usersAtEnd[0]

      const token = jwt.sign({ username: userInDb.username, id: userInDb.id }, config.SECRET)
      const decodedToken = jwt.verify(token, config.SECRET)

      const user = await User.findOne({ username: decodedToken.username })

      const newBlog = {
        title: 'Testing for absence of likes',
        author: 'Supertest',
        url: 'http://www.supertest.com',
        user: user._id
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      const blog = blogsAtEnd.find(blog => blog.title === 'Testing for absence of likes')

      assert.strictEqual(blog.likes, 0)

    })

    test('if title or url is missing, return status code 400', async () => {
      await User.deleteMany({})

      const newUser = {
        username: 'bob',
        name: 'pickachu',
        password: 'devil',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      const userInDb = usersAtEnd[0]

      const token = jwt.sign({ username: userInDb.username, id: userInDb.id }, config.SECRET)
      const decodedToken = jwt.verify(token, config.SECRET)

      const user = await User.findOne({ username: decodedToken.username })

      const newBlog = {
        author: 'Supertest',
        user: user._id
      }
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(400)
    })
  })

  describe('when there is initially one user in db', () => {
    beforeEach(async () => {
      await User.deleteMany({})

      const passwordHash = await bcrypt.hash('sekret', 10)
      const user = new User({ username: 'root', passwordHash })

      await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

      const usernames = usersAtEnd.map(u => u.username)
      assert(usernames.includes(newUser.username))
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'root',
        name: 'Superuser',
        password: 'salainen',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      assert(result.body.error.includes('expected `username` to be unique'))

      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('creation fails with proper statuscode and message if username is too short', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'qw',
        name: 'Shortname',
        password: 'normpass',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      assert(result.body.error.includes('username must be at least 3 characters long'))
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('creation fails with proper statuscode and message if password is too short', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'qwerty',
        name: 'Normname',
        password: 'qw',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      assert(result.body.error.includes('password must be at least 3 characters long'))
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
  })

  // Always last test to close the database connection
  test('zz_close database connection', async () => {
    console.log('Closing database connection...')
    await User.deleteMany({})
    console.log('users deleted.')
    await mongoose.connection.close()
    console.log('Database connection closed.')
  })
})

after(async () => {
  console.log('Running after hook...')
  await User.deleteMany({})
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
    console.log('Database connection closed.')
  } else {
    console.log('Database connection was already closed.')
  }
})
// after(async () => {
//   await mongoose.connection.close()
// })
