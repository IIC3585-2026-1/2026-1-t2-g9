export const query = (data) => createQuery([...data], [])

const projectFields = (fields) => (row) =>
  fields.reduce(
    (projectedRow, field) => ({ ...projectedRow, [field]: row[field] }),
    {}
  )

const compareValues = (direction) => (left, right) => {
  if (left === right) {
    return 0
  }

  const ascendingResult = left > right ? 1 : -1

  return direction === 'desc' ? ascendingResult * -1 : ascendingResult
}

const addRowToGroup = (field) => (groups, row) => {
  const key = row[field]
  const groupExists = groups.some((group) => group.key === key)

  return groupExists
    ? groups.map((group) =>
      group.key === key
        ? { ...group, values: [...group.values, row] }
        : group
    )
    : [...groups, { key, values: [row] }]
}

const resolveAggregations = (aggregationDefinitions, values) => {
  if (Array.isArray(aggregationDefinitions)) {
    return aggregationDefinitions.reduce(
      (result, { name, aggregationFn }) => ({
        ...result,
        [name]: aggregationFn(values)
      }),
      {}
    )
  }
  return Object.entries(aggregationDefinitions).reduce(
    (result, [name, fn]) => ({
      ...result,
      [name]: fn(values)
    }),
    {}
  )
}

const createQuery = (data, operations) => ({

  where: (predicate) =>
    createQuery(data, [
      ...operations,
      (rows) => rows.filter(predicate)
    ]),

  select: (fields) =>
    createQuery(data, [
      ...operations,
      (rows) => rows.map(projectFields(fields))
    ]),

  orderBy: (field, direction = 'asc') =>
    createQuery(data, [
      ...operations,
      (rows) => [...rows].sort((leftRow, rightRow) =>
        compareValues(direction)(leftRow[field], rightRow[field])
      )
    ]),

  groupBy: (field) =>
    createQuery(data, [
      ...operations,
      (rows) => rows.reduce(addRowToGroup(field), [])
    ]),

  aggregate: (aggregationDefinitions) =>
    createQuery(data, [
      ...operations,
      (groups) =>
        groups.map((group) => ({
          key: group.key,
          ...resolveAggregations(aggregationDefinitions, group.values)
        }))
    ]),
  
  limit: (n) =>
    createQuery(data, [
      ...operations,
      (rows) => rows.slice(0, n)
    ]),
  
  skip: (n) =>
    createQuery(data, [
      ...operations,
      (rows) => rows.slice(n)
    ]),
  
  distinct: (field) =>
    createQuery(data, [
      ...operations,
      (rows) =>
        rows.reduce((acc, row) => {
          const exists = acc.some((r) => r[field] === row[field])
          return exists ? acc : [...acc, row]
        }, [])
    ]),
  
  join: (otherData, localKey, foreignKey) =>
    createQuery(data, [
      ...operations,
      (rows) =>
        rows.flatMap((row) =>
          otherData
            .filter((item) => item[foreignKey] === row[localKey])
            .map((match) => ({
              ...row,
              joined: match
            }))
        )
    ]),

  execute: () =>
    operations.reduce((acc, operation) => operation(acc), data)
})
