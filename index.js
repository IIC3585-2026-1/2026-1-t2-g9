import { query } from './query.js';
import { movies } from './data.js';

const printResult = (title, result) => {
  console.log(`\n=== ${title} ===`)
  console.table(result)
}

const recentMovies = query(movies)
  .where((movie) => movie.year > 2010)
  .select(['title', 'year', 'rating'])
  .orderBy('rating', 'desc')
  .execute()

const longestMovies = query(movies)
  .select(['title', 'duration', 'genre'])
  .orderBy('duration', 'desc')
  .execute()

const moviesByGenre = query(movies)
  .groupBy('genre')
  .aggregate([
    {
      name: 'count',
      aggregationFn: (items) => items.length
    },
    {
      name: 'averageRating',
      aggregationFn: (items) =>
      Number(
        (
          items.reduce((sum, movie) => sum + movie.rating, 0) / items.length
        ).toFixed(2)
      )
    }
  ])
  .orderBy('averageRating', 'desc')
  .execute()

const moviesByCountry = query(movies)
  .where((movie) => movie.year > 2000)
  .groupBy('country')
  .aggregate([
    {
      name: 'count',
      aggregationFn: (items) => items.length
    },
    {
      name: 'averageDuration',
      aggregationFn: (items) =>
      Number(
        (
          items.reduce((sum, movie) => sum + movie.duration, 0) / items.length
        ).toFixed(2)
      )
    }
  ])
  .orderBy('averageDuration', 'desc')
  .execute()

const top3Movies = query(movies)
  .orderBy('rating', 'desc')
  .limit(3)
  .select(['title', 'rating'])
  .execute()

const skipFirst3 = query(movies)
  .orderBy('rating', 'desc')
  .skip(3)
  .limit(3)
  .select(['title', 'rating'])
  .execute()

const uniqueGenres = query(movies)
  .distinct('genre')
  .select(['genre'])
  .execute()

const users = [
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Luis' },
  { id: 3, name: 'Carla' }
]

const orders = [
  { id: 101, userId: 1, total: 50 },
  { id: 102, userId: 1, total: 75 },
  { id: 103, userId: 2, total: 20 }
]

const usersWithOrders = query(users)
  .join(orders, 'id', 'userId')
  .execute()



printResult('Peliculas recientes mejor evaluadas', recentMovies)
printResult('Peliculas mas largas', longestMovies)
printResult('Cantidad y rating promedio por genero', moviesByGenre)
printResult('Peliculas por pais desde 2001', moviesByCountry)
printResult('Top 3 películas mejor evaluadas', top3Movies)
printResult('Películas del ranking 4 al 6', skipFirst3)
printResult('Géneros únicos', uniqueGenres)
printResult('Usuarios con sus órdenes', usersWithOrders)