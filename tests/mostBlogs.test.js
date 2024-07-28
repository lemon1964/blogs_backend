const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')
const blogs = require('./test_blogs').blogs

const transformedBlogs = blogs.map(blog => {
  delete blog._id
  delete blog.__v
  delete blog.url
  delete blog.likes
  return blog
})

describe('most blogs', () => {

  test('author with most blogs', () => {
    const result = listHelper.mostBlogs(transformedBlogs)
    assert.deepStrictEqual(result, { author: 'Robert C. Martin', blogs: 3 })
  })
})