# useAsyncQuery

Mirrors the functionality of
[Apollo client's useQuery hook](https://www.apollographql.com/docs/react/data/queries/#usequery-api),
but with a "query" being any async function of the format
`(variables: Record<string, any>) => any` rather than a GQL statement.

[![codecov](https://codecov.io/gh/penx/use-async-query/branch/main/graph/badge.svg)](https://codecov.io/gh/penx/use-async-query)

## Usage

```sh
npm i use-async-query
```

### Example usage with Firestore

```ts
import firestore from '@firebase/firestore'
import { useQuery } from 'use-async-query'

import { Loading, Error, Results } from './components'

const myQuery = (variables) => firestore()
  .collection('myCollection')
  .where('example', '==', variables.example)
  .get()

const MyComponent = () => {
  const {loading, error, data} = useQuery(myQuery, { variables: { example: 'test' }})

  return <>
    {loading && <Loading />}
    {error && <Error error={error} />}
    {data && <Results data={data}>}
  </>
}
```

## API

### `useQuery(query, options)`

| Name        | Type | Description |
| ----------- | ----------- | ----------- |
| query | `(variables?: TVariables) => Promise<TData>`   | Any async function that takes a single variables argument. |
| options | `Record`   | An options object, see below. |

#### Options

| Name        | Type | Description |
| ----------- | ----------- | ----------- |
| variables | `Record<string, any>`   | The variables that are passed to the query function. |
| skip | `boolean` | If set to true, the query is not called for the current render. |
| onCompleted | `(data: TData) => void` | A function that's called when the query completes successfully.  |
| onError | `(error: any) => void` | A function that's called when an error is thrown by the query. |

#### Result

| Name        | Type | Description |
| ----------- | ----------- | ----------- |
| data | `TData`   | The return value from the latest query, once completed. |
| previousData | `TData`   | The return value from the previous query. |
| refetch | `(variables?: Partial<TVariables>) => Promise<QueryResult<TData, TVariables>>` | Refetch data by calling the query again. Partial variables are added to variables set in the hook options. |
| loading | `boolean`   | Returns `true` if the latest query has not completed. |
| error | `any`   | The error response if the latest query returned an error. |

### `useLazyQuery(query, options)`

The API for `useLazyQuery` is identical to `useQuery` above, except that:

1. the query is not immediately executed
2. the result is a tuple `[execute, queryResult]` where
   - `execute` is a function that runs the query
   - `queryResult` is an object matching the useQuery result above

## Alternatives

If you want to fetch data in a hook but don't care about the apollo-client API:

- [react-hooks-fetch](https://github.com/dai-shi/react-hooks-fetch)
- [react-query](https://github.com/tanstack/query)

If you don't want to use a hook:

- Lean on your router to fetch data for you, e.g. [Remix's loader](https://remix.run/docs/en/v1/api/conventions#loader) and the [React Router equivalent](https://reactrouter.com/en/dev/route/loader) (currently in beta)
- Use React Suspense, e.g. [react-suspense-fetch](https://github.com/dai-shi/react-suspense-fetch)
