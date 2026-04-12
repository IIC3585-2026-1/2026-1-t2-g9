import { query } from '../query.js'
import { movies } from '../data.js'

const container = document.getElementById('movies')

const render = (data) => {
  container.innerHTML = data.map(m => `
    <div class="card">
      <img src="${m.image}" alt="${m.title}">
      <div class="info">
        <h3>${m.title}</h3>
        <p>⭐ ${m.rating}</p>
        <p>🎭 ${m.genre}</p>
        <p>📅 ${m.year}</p>
      </div>
    </div>
  `).join('')
}

window.runQuery = () => {
  const genre = document.getElementById('genre').value
  const rating = Number(document.getElementById('rating').value)
  const order = document.getElementById('order').value

  let q = query(movies)

  if (genre) q = q.where(m => m.genre === genre)
  if (rating) q = q.where(m => m.rating >= rating)
  if (order) q = q.orderBy('rating', order)

  render(q.execute())
}

// render inicial
render(movies)