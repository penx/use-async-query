import {useState, useEffect} from 'react';

/**
 * Mirrors the functionality of
 * [Apollo's useQuery hook](https://www.apollographql.com/docs/react/data/queries/#usequery-api),
 * but with a "query" being any async function rather than GQL statement.
 */
export const useAsyncQuery = <Data, Variables>(
  query: (variables: Variables) => Promise<Data>,
  options: {
    variables: Variables; //TODO: call signature without Variables, optional Options
    skip?: boolean;
    onCompleted?: (data: Data) => void;
    onError?: (error: Error) => void;
  },
): {loading: boolean; error: Error | null; data: Data | null} => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState(null);

  const {variables, skip, onCompleted, onError} = options || {};

  useEffect(() => {
    let isLatest = true;
    if (skip) {
      setLoading(false);
      setError(null);
    } else {
      const promise = query(variables);
      setLoading(true);
      setData(null);
      setError(null);
      promise
        .then(response => {
          if (isLatest) {
            setData(response);
            setLoading(false);
            setError(null);
            onCompleted?.(response);
          }
        })
        .catch(e => {
          if (isLatest) {
            setData(null);
            setLoading(false);
            setError(e);
            onError?.(e);
          }
        });
    }
    return () => {
      isLatest = false;
    };
  }, [query, variables, onCompleted, onError, skip]);

  return {loading, error, data};
};

export default useAsyncQuery;