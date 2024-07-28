const _ = require('lodash')

const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item.likes
  }

  return blogs.length === 0
    ? 0
    : blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  const reducer = (max, item) => {
    return max.likes > item.likes ? max : item
  }
  return blogs.length === 0
    ? {}
    : blogs.reduce(reducer, 0)
}

const mostBlogs = (blogs) => {
  const grouped = _.groupBy(blogs, 'author')
  const counted = _.mapValues(grouped, blogs => blogs.length)
  const [author, count] = _.maxBy(Object.entries(counted), ([, count]) => count)
  return { author, blogs: count }
}

// First on the list of top authors
const mostLikes = (blogs) => {
  const grouped = _.groupBy(blogs, 'author')
  const counted = _.mapValues(grouped, blogs => _.sumBy(blogs, 'likes'))
  const [author, likes] = _.maxBy(Object.entries(counted), ([, likes]) => likes)
  return { author, likes }
}

// // List all top authors
// const mostLikes = (blogs) => {
//   const grouped = _.groupBy(blogs, 'author')
//   const counted = _.mapValues(grouped, blogs => _.sumBy(blogs, 'likes'))
//   const maxLikes = Math.max(...Object.values(counted))
//   const topAuthors = Object.entries(counted)
//     .filter(([author, likes]) => likes === maxLikes)
//     .map(([author, likes]) => ({ author, likes }))
//   return topAuthors
// }

module.exports = {
  dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes
}
