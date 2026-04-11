import { query } from './query.js';
import { movies } from './data.js';

const result = query(movies)
  .where(m => m.year > 2000)
  .execute()

console.log(result)