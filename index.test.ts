import { renderHook, act } from "@testing-library/react-hooks";
import { useAsyncQuery } from ".";

class Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void = () => null;
  reject: (reason?: any) => void = () => null;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

describe("useAsyncQuery", () => {
  it("should start with loading set to true", async () => {
    const deferred = new Deferred<string>();

    const mockAPI = jest.fn();
    const render = jest.fn();
    const query = (variables: string) => {
      mockAPI(variables);
      return deferred.promise;
    };

    const useWrapper = (query, options) => {
      const result = useAsyncQuery(query, options);
      render(result);
      return result;
    };

    const { result } = renderHook((options) => useWrapper(query, options), {
      initialProps: { variables: "run1" },
    });

    expect(mockAPI).toHaveBeenCalledWith("run1");
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(render).toHaveBeenCalledTimes(1);
  });

  describe("when skip is set to true", () => {
    it("should start with loading set to false", async () => {
      const deferred = new Deferred<string>();

      const mockAPI = jest.fn();
      const render = jest.fn();
      const query = (variables: string) => {
        mockAPI(variables);
        return deferred.promise;
      };

      const useWrapper = (query, options) => {
        const result = useAsyncQuery<string, string>(query, options);
        render(result);
        return result;
      };

      const { result, rerender } = renderHook<
        {
          variables: string;
          skip?: boolean;
        },
        { loading: boolean; error: Error; data: string }
      >((options) => useWrapper(query, options), {
        initialProps: { variables: "run1", skip: true },
      });

      expect(mockAPI).toHaveBeenCalledTimes(0);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(render).toHaveBeenCalledTimes(1);

      rerender({ variables: "run2" });

      expect(mockAPI).toHaveBeenCalledWith("run2");
      expect(mockAPI).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(render).toHaveBeenCalledTimes(2);

      await act(async () => {
        deferred.resolve("resolved");
      });

      expect(mockAPI).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe("resolved");
      expect(render).toHaveBeenCalledTimes(3);
    });
  });

  it("should handle queries completing in series", async () => {
    const deferred1 = new Deferred();
    const deferred2 = new Deferred();

    const mockAPI = jest.fn();
    const query = (variables: string) => {
      mockAPI(variables);
      if (variables === "run1") {
        return deferred1.promise;
      } else {
        return deferred2.promise;
      }
    };

    const { result, rerender } = renderHook(
      (options) => useAsyncQuery(query, options),
      {
        initialProps: { variables: "run1" },
      }
    );

    expect(mockAPI).toHaveBeenCalledWith("run1");
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await act(async () => {
      deferred1.resolve(1);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(1);

    rerender({ variables: "run2" });
    expect(mockAPI).toHaveBeenCalledWith("run2");

    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await act(async () => {
      deferred2.resolve(2);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(2);
  });

  it("should handle parallel queries completing in order", async () => {
    const deferred1 = new Deferred();
    const deferred2 = new Deferred();

    const mockAPI = jest.fn();
    const query = (variables: string) => {
      mockAPI(variables);
      if (variables === "run1") {
        return deferred1.promise;
      } else {
        return deferred2.promise;
      }
    };

    const { result, rerender } = renderHook(
      (options) => useAsyncQuery(query, options),
      {
        initialProps: { variables: "run1" },
      }
    );

    expect(mockAPI).toHaveBeenCalledWith("run1");
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    rerender({ variables: "run2" });

    expect(mockAPI).toHaveBeenCalledWith("run2");
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await act(async () => {
      deferred1.resolve(1);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await act(async () => {
      deferred2.resolve(2);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(2);
  });

  it("should handle parallel queries completing in reverse order", async () => {
    const deferred1 = new Deferred();
    const deferred2 = new Deferred();

    const mockAPI = jest.fn();
    const query = (variables: string) => {
      mockAPI(variables);
      if (variables === "run1") {
        return deferred1.promise;
      } else {
        return deferred2.promise;
      }
    };

    const { result, rerender } = renderHook(
      (options) => useAsyncQuery(query, options),
      {
        initialProps: { variables: "run1" },
      }
    );

    expect(mockAPI).toHaveBeenCalledWith("run1");
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    rerender({ variables: "run2" });

    expect(mockAPI).toHaveBeenCalledWith("run2");
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await act(async () => {
      deferred2.resolve(2);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(2);

    await act(async () => {
      deferred1.resolve(1);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(2);
  });

  it("reports an error if query fails", async () => {
    const deferred1 = new Deferred();

    const mockAPI = jest.fn();
    const errorLog = jest.fn();
    const query = (variables: string) => {
      mockAPI(variables);
      return deferred1.promise;
    };

    const { result } = renderHook((options) => useAsyncQuery(query, options), {
      initialProps: { variables: "run1", onError: errorLog },
    });

    expect(mockAPI).toHaveBeenCalledWith("run1");
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await act(async () => {
      deferred1.reject("some error");
    });

    expect(result.current.error).toBe("some error");
    expect(errorLog).toHaveBeenCalledTimes(1);
  });

  it("doesn't report an error if a new query has started after a query fails", async () => {
    const deferred1 = new Deferred();
    const deferred2 = new Deferred();

    const mockAPI = jest.fn();
    const errorLog = jest.fn();
    const query = (variables: string) => {
      mockAPI(variables);
      if (variables === "run1") {
        return deferred1.promise;
      } else {
        return deferred2.promise;
      }
    };

    const { result, rerender } = renderHook(
      (options) => useAsyncQuery(query, options),
      {
        initialProps: { variables: "run1", onError: errorLog },
      }
    );

    expect(mockAPI).toHaveBeenCalledWith("run1");
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    rerender({ variables: "run2", onError: errorLog });

    expect(mockAPI).toHaveBeenCalledWith("run2");
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await act(async () => {
      deferred1.reject("an error");
    });

    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await act(async () => {
      deferred2.resolve(2);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(2);

    expect(errorLog).toHaveBeenCalledTimes(0);
  });
});
