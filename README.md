# useAsyncQuery

Mirrors the functionality of
[Apollo's useQuery hook](https://www.apollographql.com/docs/react/data/queries/#usequery-api),
but with a "query" being any async function rather than GQL statement.

## Usage

```sh
npm i use-async-query
```

### Example usage with Firestore

```ts
import firestore from '@firebase/firestore';
import useQuery from 'use-query';

const myQuery = (variables) => firestore()
    .collection('myCollection')
    .where('example', '==', variables.example)
    .get()

const MyComponent = () => {
    const {loading, error, data} = useQuery(myQuery, { variables: { example: 'test' }})
}
```
