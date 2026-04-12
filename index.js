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
  .aggregate({
    count: (items) => items.length,
    averageRating: (items) =>
      Number(
        (
          items.reduce((sum, movie) => sum + movie.rating, 0) / items.length
        ).toFixed(2)
      )
  })
  .orderBy('averageRating', 'desc')
  .execute()

const moviesByCountry = query(movies)
  .where((movie) => movie.year > 2000)
  .groupBy('country')
  .aggregate({
    count: (items) => items.length,
    averageDuration: (items) =>
      Number(
        (
          items.reduce((sum, movie) => sum + movie.duration, 0) / items.length
        ).toFixed(2)
      )
  })
  .orderBy('averageDuration', 'desc')
  .execute()

printResult('Peliculas recientes mejor evaluadas', recentMovies)
printResult('Peliculas mas largas', longestMovies)
printResult('Cantidad y rating promedio por genero', moviesByGenre)
printResult('Peliculas por pais desde 2001', moviesByCountry)
