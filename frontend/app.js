import { query } from '../query.js'

const container = document.getElementById('movies')

let movies = [] 

fetch('../movies.json')
  .then(res => res.json())
  .then(data => {
    movies = data
    render(movies)
    showOperations('query')
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

const operationsExamples = {
  query: {
    desc: 'Punto de entrada. Recibe un array y protege el original con spread.',
    impl: `export const query = (data) => createQuery([...data], [])`,
    code: `query(movies).execute()`,
    run: () => query(movies).execute()
  },
  where: {
    desc: 'Filtra elementos según una función predicado.',
    impl: `where: (predicate) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.filter(predicate)\n  ]),`,
    code: `query(movies)\n  .where(movie => movie.rating >= 8)\n  .execute()`,
    run: () => query(movies).where(movie => movie.rating >= 9).execute()
  },
  select: {
    desc: 'Retorna solo las propiedades indicadas de cada fila.',
    impl: `select: (fields) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.map(projectFields(fields))\n  ]),\n\nconst projectFields = (fields) => (row) =>\n  fields.reduce(\n    (projectedRow, field) => ({ ...projectedRow, [field]: row[field] }),\n    {}\n  )`,
    code: `query(movies)\n  .select(['title', 'rating'])\n  .execute()`,
    run: () => query(movies).select(['title', 'rating']).execute()
  },
  orderBy: {
    desc: 'Ordena los resultados por un campo en dirección ascendente o descendente.',
    impl: `orderBy: (field, direction = 'asc') =>\n  createQuery(data, [\n    ...operations,\n    (rows) => [...rows].sort((l, r) =>\n      compareValues(direction)(l[field], r[field])\n    )\n  ]),\n\nconst compareValues = (direction) => (left, right) => {\n  if (left === right) return 0\n  const asc = left > right ? 1 : -1\n  return direction === 'desc' ? ascendingResult * -1 : ascendingResult\n}`,
    code: `query(movies)\n  .orderBy('rating', 'desc')\n  .execute()`,
    run: () => query(movies).orderBy('rating', 'desc').execute()
  },
  groupBy: {
    desc: 'Agrupa las filas por el valor de un campo.',
    impl: `groupBy: (field) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.reduce(addRowToGroup(field), [])\n  ]),\n\nconst addRowToGroup = (field) => (groups, row) => {\n  const key = row[field]\n  const exists = groups.some(g => g.key === key)\n  return exists\n    ? groups.map(g => g.key === key\n        ? { ...g, values: [...g.values, row] }\n        : g)\n    : [...groups, { key, values: [row] }]\n}`,
    code: `query(movies)\n  .where(movie => movie.year > 2000)\n  .groupBy('genre')\n  .execute()`,
    run: () =>
      query(movies)
        .where(movie => movie.year > 2000)
        .groupBy('genre')
        .execute()
        .map(group => ({
          genre: group.key,
          count: group.values.length,
          titles: group.values.map(v => v.title).join(', ')
        }))
  },
  aggregate: {
    desc: 'Aplica funciones de agregación a cada grupo. Acepta objeto { nombre: fn } o array [{ name, aggregationFn }].',
    impl: `aggregate: (defs) =>\n  createQuery(data, [\n    ...operations,\n    (groups) => groups.map(group => ({\n      key: group.key,\n      ...resolveAggregations(defs, group.values)\n    }))\n  ]),\n\nconst resolveAggregations = (defs, values) => {\n  if (Array.isArray(defs))\n    return defs.reduce((res, { name, aggregationFn }) => ({\n      ...res, [name]: aggregationFn(values)\n    }), {})\n  return Object.entries(defs).reduce((res, [name, fn]) => ({\n    ...res, [name]: fn(values)\n  }), {})\n}`,
    code: `query(movies)\n  .groupBy('genre')\n  .aggregate({\n    count: items => items.length,\n    avgRating: items =>\n      Number(\n        (items.reduce((sum, m) => sum + m.rating, 0) / items.length).toFixed(2)\n      )\n  })\n  .execute()`,
    run: () =>
      query(movies)
        .groupBy('genre')
        .aggregate({
          count: items => items.length,
          avgRating: items =>
            Number(
              (items.reduce((sum, m) => sum + m.rating, 0) / items.length).toFixed(2)
            )
        })
        .execute()
  },
  execute: {
    desc: 'Ejecuta el pipeline aplicando todas las operaciones acumuladas con reduce.',
    impl: `execute: () =>\n  operations.reduce((acc, operation) => operation(acc), data)`,
    code: `query(movies)
    .where(m => m.rating > 8.5)
    .select(['title', 'rating'])
    .execute()`,

    run: () =>
      query(movies)
        .where(m => m.rating > 8.5)
        .select(['title', 'rating'])
        .execute()
  },
  limit: {
    desc: 'Recorta el array a los primeros n elementos usando slice. Útil para paginación o mostrar un top N.',
    code: `query(movies)\n  .orderBy('rating', 'desc')\n  .limit(3)\n  .execute()`,
    impl: `limit: (n) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.slice(0, n)\n  ]),`,
    run: () => query(movies).orderBy('rating', 'desc').limit(3).select(['title', 'rating']).execute()
  },
  skip: {
    desc: 'Omite los primeros n elementos. Combinado con limit permite paginar.',
    code: `query(movies)\n  .orderBy('rating', 'desc')\n  .skip(3)\n  .limit(3)\n  .execute()`,
    impl: `skip: (n) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.slice(n)\n  ]),`,
    run: () => query(movies).orderBy('rating', 'desc').skip(3).limit(3).select(['title', 'rating']).execute()
  },
  distinct: {
    desc: 'Elimina duplicados según un campo. Recorre el array con reduce y solo agrega una fila si el valor del campo no fue visto antes.',
    code: `query(movies)\n  .distinct('genre')\n  .select(['genre'])\n  .execute()`,
    impl: `distinct: (field) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.reduce((acc, row) => {\n      const exists = acc.some(r => r[field] === row[field])\n      return exists ? acc : [...acc, row]\n    }, [])\n  ]),`,
    run: () => query(movies).distinct('genre').select(['genre']).execute()
  },
  join: {
    desc: 'INNER JOIN entre dos datasets. Combina cada fila con las coincidencias del otro array según las claves indicadas. Sin coincidencias, la fila desaparece.',
    code: `query(movies)\n  .join(orders, 'id', 'movieId')\n  .execute()`,
    impl: `join: (otherData, localKey, foreignKey) =>\n  createQuery(data, [\n    ...operations,\n    (rows) => rows.flatMap(row =>\n      otherData\n        .filter(item => item[foreignKey] === row[localKey])\n        .map(match => ({ ...row, joined: match }))\n    )\n  ]),`,
    run: () => query(movies).join(orders, 'id', 'movieId').execute()
      .map(r => ({ title: r.title, user: r.joined.user }))
  }
}

const renderOperationsTable = (data) => {
  if (!data || !data.length) return '<p style="color:#aaa">Sin resultados</p>'
  const first = data[0]
  if ('values' in first && Array.isArray(first.values)) {
    return `<table>
      <tr><th>key</th><th>values (count)</th><th>muestra</th></tr>
      ${data.map(group => `<tr>
        <td>${group.key}</td>
        <td>${group.values.length} items</td>
        <td>${group.values.map(v => v.title || v.name || JSON.stringify(v)).join(', ').slice(0, 60)}…</td>
      </tr>`).join('')}
    </table>`
  }
  const keys = Object.keys(first)
  return `<table>
    <tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>
    ${data.map(row => `<tr>${keys.map(k => {
      const val = row[k]
      return `<td>${typeof val === 'object' ? JSON.stringify(val) : val}</td>`
    }).join('')}</tr>`).join('')}
  </table>`
}

window.showOperations = (key) => {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'))
  document.querySelector(`.tab-btn[onclick="showOperations('${key}')"]`).classList.add('active')

  const example = operationsExamples[key]
  document.getElementById('operations-desc').textContent = example.desc
  document.getElementById('operations-code').textContent = example.code
  document.getElementById('operations-impl').textContent = example.impl
  document.getElementById('operations-result').innerHTML = renderOperationsTable(example.run())
}


const resizer = document.getElementById('resizer')
const infoSection = document.querySelector('.info-section')

let isResizing = false
let startX = 0
let startWidth = 0

resizer.addEventListener('mousedown', (e) => {
  isResizing = true
  startX = e.clientX
  startWidth = infoSection.offsetWidth
  resizer.classList.add('dragging')
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
})

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return
  const delta = startX - e.clientX
  const newWidth = Math.min(Math.max(startWidth + delta, 250), window.innerWidth * 0.6)
  infoSection.style.width = newWidth + 'px'
})

document.addEventListener('mouseup', () => {
  if (!isResizing) return
  isResizing = false
  resizer.classList.remove('dragging')
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
})

const originalRender = render
fetch('../movies.json')