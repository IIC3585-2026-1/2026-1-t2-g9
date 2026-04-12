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

const resolveAggregations = (aggregationDefinitions, values) =>
  aggregationDefinitions.reduce(
    (result, { name, aggregationFn }) => ({
      ...result,
      [name]: aggregationFn(values)
    }),
    {}
  )

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

  execute: () =>
    operations.reduce((acc, operation) => operation(acc), data)
})
