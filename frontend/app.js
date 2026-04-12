import { query } from '../query.js'

const container = document.getElementById('movies')

let movies = [] 

fetch('../movies.json')
  .then(res => res.json())
  .then(data => {
    movies = data
    render(movies)
    showBonus('limit')
  })

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


const orders = [
  { orderId: 1, movieId: 1, user: 'Ana' },
  { orderId: 2, movieId: 3, user: 'Luis' },
  { orderId: 3, movieId: 1, user: 'Carla' },
]

const bonusExamples = {
  limit: {
    code: `query(movies)\n  .orderBy('rating', 'desc')\n  .limit(3)\n  .execute()`,
    impl: `limit: (n) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.slice(0, n)\n  ]),`,
    run: () => query(movies).orderBy('rating', 'desc').limit(3).select(['title', 'rating']).execute()
  },
  skip: {
    code: `query(movies)\n  .orderBy('rating', 'desc')\n  .skip(3)\n  .limit(3)\n  .execute()`,
    impl: `skip: (n) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.slice(n)\n  ]),`,
    run: () => query(movies).orderBy('rating', 'desc').skip(3).limit(3).select(['title', 'rating']).execute()
  },
  distinct: {
    code: `query(movies)\n  .distinct('genre')\n  .select(['genre'])\n  .execute()`,
    impl: `distinct: (field) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.reduce((acc, row) => {\n      const exists = acc.some(r => r[field] === row[field])\n      return exists ? acc : [...acc, row]\n    }, [])\n  ]),`,
    run: () => query(movies).distinct('genre').select(['genre']).execute()
  },
  join: {
    code: `query(movies)\n  .join(orders, 'id', 'movieId')\n  .execute()`,
    impl: `join: (otherData, localKey, foreignKey) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.flatMap(row =>\n      otherData\n        .filter(item => item[foreignKey] === row[localKey])\n        .map(match => ({ ...row, joined: match }))\n    )\n  ]),`,
    run: () => query(movies).join(orders, 'id', 'movieId').execute()
      .map(r => ({ title: r.title, user: r.joined.user }))
  }
}

const renderBonusTable = (data) => {
  if (!data.length) return '<p style="color:#aaa">Sin resultados</p>'
  const keys = Object.keys(data[0])
  return `<table>
    <tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>
    ${data.map(row => `<tr>${keys.map(k => `<td>${row[k]}</td>`).join('')}</tr>`).join('')}
  </table>`
}

window.showBonus = (key) => {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'))
  document.querySelector(`.tab-btn[onclick="showBonus('${key}')"]`).classList.add('active')

  const example = bonusExamples[key]
  document.getElementById('bonus-code').textContent = example.code
  document.getElementById('bonus-impl').textContent = example.impl   // ← nueva línea
  document.getElementById('bonus-result').innerHTML = renderBonusTable(example.run())
}

// Mostrar el primero por defecto cuando carguen los datos
const originalRender = render
fetch('../movies.json')  // ya tienes este fetch arriba, solo agrega esto al .then:
// → al final del .then(data => { ... }) agrega:
//    showBonus('limit')