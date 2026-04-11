export const query = (data) => createQuery([...data], [])

const createQuery = (data, operations) => ({

  where: (predicate) =>
    createQuery(data, [
      ...operations,
      (d) => d.filter(predicate)
    ]),

  execute: () =>
    operations.reduce((acc, op) => op(acc), data)
})