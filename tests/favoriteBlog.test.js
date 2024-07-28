const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')
const blogs = require('./test_blogs').blogs

const transformedBlogs = blogs.map(blog => {
  delete blog._id
  delete blog.__v
  delete blog.url
  return blog
})

describe('favorite blog', () => {

  test('blog with maximum number of likes', () => {
    const result = listHelper.favoriteBlog(transformedBlogs)
    assert.deepStrictEqual(result, {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      likes: 12
    })
  })
})