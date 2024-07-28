const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')
const blogs = require('./test_blogs').blogs

const transformedBlogs = blogs.map(blog => {
  delete blog._id
  delete blog.__v
  delete blog.url
  delete blog.title
  return blog
})

describe('most likes', () => {
  // First on the list of top authors
  test('author with most likes', () => {
    const result = listHelper.mostLikes(transformedBlogs)
    const expectedResults = [
      { author: 'Edsger W. Dijkstra', likes: 17 },
      { author: 'One of the authors of the added list', likes: 17 }
    ]
    const resultInExpected = expectedResults.some(expectedResult =>
      result.author === expectedResult.author && result.likes === expectedResult.likes
    )
    assert.strictEqual(resultInExpected, true)
  })

  // // List all top authors
  // test('author(s) with most likes', () => {
  //   const result = listHelper.mostLikes(transformedBlogs)
  //   const expectedResults = [
  //     { author: 'Edsger W. Dijkstra', likes: 17 },
  //     { author: 'One of the authors of the added list', likes: 17 }
  //   ]
  //   const allResultsInExpected = result.every(r =>
  //     expectedResults.some(expectedResult =>
  //       r.author === expectedResult.author && r.likes === expectedResult.likes
  //     )
  //   )
  //   assert.strictEqual(allResultsInExpected, true)
  //   assert.strictEqual(result.length, expectedResults.length)
  // })
})