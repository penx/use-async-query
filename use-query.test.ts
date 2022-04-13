import {
  renderHook,
  act,
  RenderHookResult,
} from "@testing-library/react-hooks";
import {
  QueryOptions,
  QueryOptionsWithVariables,
  QueryResult,
  useQuery,
} from "./use-query";

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

describe("useQuery", () => {
  describe("when an asyncronous query with variables", () => {
    let deferred: Deferred<string>;
    const mockQuery = jest.fn<Promise<string>, [{ option: string }]>();

    beforeEach(() => {
      deferred = new Deferred<string>();
      mockQuery.mockReturnValue(deferred.promise);
    });
    afterEach(() => {
      mockQuery.mockReset();
    });

    describe("is called", () => {
      let renderHookResult: RenderHookResult<
        QueryOptionsWithVariables<string, { option: string }>,
        QueryResult<string, { option: string }>
      >;
      const onCompleted = jest.fn<void, [string]>();
      const onError = jest.fn<void, [any]>();
      beforeEach(() => {
        renderHookResult = renderHook<
          QueryOptionsWithVariables<string, { option: string }>,
          QueryResult<string, { option: string }>
        >(
          (options) => useQuery<string, { option: string }>(mockQuery, options),
          {
            initialProps: {
              variables: { option: "run1" },
              onCompleted,
              onError,
            },
          }
        );
      });
      afterEach(() => {
        onCompleted.mockReset();
        onError.mockReset();
      });
      it("should start with loading set to true", async () => {
        expect(mockQuery).toHaveBeenCalledWith({ option: "run1" });
        expect(renderHookResult.result.current.error).toBe(null);
        expect(renderHookResult.result.current.loading).toBe(true);
        expect(renderHookResult.result.current.data).toBe(null);
        expect(renderHookResult.result.all.length).toBe(1);
      });

      describe("the query resolves", () => {
        beforeEach(async () => {
          await act(async () => {
            deferred.resolve("resolved");
          });
        });
        it("should return with loading set to false", () => {
          expect(mockQuery).toHaveBeenCalledTimes(1);
          expect(renderHookResult.result.current.error).toBe(null);
          expect(renderHookResult.result.current.loading).toBe(false);
          expect(renderHookResult.result.current.data).toBe("resolved");
          expect(renderHookResult.result.all.length).toBe(2);
        });

        it("should call onCompleted with data returned from query", async () => {
          expect(onCompleted).toHaveBeenCalledTimes(1);
          expect(onCompleted).toHaveBeenCalledWith("resolved");
        });
        it("should not return any previousData", () => {
          expect(renderHookResult.result.current.previousData).toBe(null);
        });

        describe("the hook is called again with the same props", () => {
          beforeEach(async () => {
            await act(async () => {
              renderHookResult.rerender({
                variables: { option: "run1" },
                onCompleted,
                onError,
              });
            });
          });
          it("should not call the query again", () => {
            expect(mockQuery).toHaveBeenCalledTimes(1);
          });
          it("should not call onCompleted again", () => {
            expect(onCompleted).toHaveBeenCalledTimes(1);
          });
          it("should not call onError", () => {
            expect(onError).not.toHaveBeenCalled();
          });
          it("should not return any previousData", () => {
            expect(renderHookResult.result.current.previousData).toBe(null);
          });
        });

        describe("is called with different variables", () => {
          let deferred2: Deferred<string>;
          beforeEach(() => {
            deferred2 = new Deferred<string>();
            mockQuery.mockReturnValue(deferred2.promise);
            renderHookResult.rerender({ variables: { option: "run2" } });
          });

          it("should return with loading=true and data=null", () => {
            expect(mockQuery).toHaveBeenCalledTimes(2);
            expect(mockQuery).toHaveBeenCalledWith({ option: "run2" });
            expect(renderHookResult.result.current.error).toBe(null);
            expect(renderHookResult.result.current.loading).toBe(true);
            expect(renderHookResult.result.current.data).toBe(null);
          });

          it("should return previousData", () => {
            expect(renderHookResult.result.current.previousData).toBe(
              "resolved"
            );
          });

          describe("the second query resolves", () => {
            beforeEach(async () => {
              await act(async () => {
                deferred2.resolve("2nd resolved");
              });
            });

            it("should return with data from the second query", () => {
              expect(renderHookResult.result.current.error).toBe(null);
              expect(renderHookResult.result.current.loading).toBe(false);
              expect(renderHookResult.result.current.data).toBe("2nd resolved");
            });
            it("should return previousData from the first query", () => {
              expect(renderHookResult.result.current.previousData).toBe(
                "resolved"
              );
            });
          });
        });
      });

      describe("the query is rejected", () => {
        beforeEach(async () => {
          await act(async () => {
            deferred.reject("rejected");
          });
        });

        it("reports an error and calls onError", async () => {
          expect(renderHookResult.result.current.error).toBe("rejected");
          expect(onError).toHaveBeenCalledTimes(1);
          expect(onError).toHaveBeenCalledWith("rejected");
        });
      });

      describe("is called with different variables", () => {
        let deferred2: Deferred<string>;
        beforeEach(() => {
          deferred2 = new Deferred<string>();
          mockQuery.mockReturnValue(deferred2.promise);
          renderHookResult.rerender({ variables: { option: "run2" } });
        });

        it("should return with loading=true and data=null", () => {
          expect(mockQuery).toHaveBeenCalledTimes(2);
          expect(mockQuery).toHaveBeenCalledWith({ option: "run2" });
          expect(renderHookResult.result.current.error).toBe(null);
          expect(renderHookResult.result.current.loading).toBe(true);
          expect(renderHookResult.result.current.data).toBe(null);
        });

        describe("the second query resolves", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred2.resolve("2nd resolved");
            });
          });

          it("should return with data from the second query", () => {
            expect(renderHookResult.result.current.error).toBe(null);
            expect(renderHookResult.result.current.loading).toBe(false);
            expect(renderHookResult.result.current.data).toBe("2nd resolved");
          });

          describe("the first query resolves", () => {
            beforeEach(async () => {
              await act(async () => {
                deferred.resolve("1st resolved");
              });
            });

            it("should return with data from the second query", () => {
              expect(renderHookResult.result.current.error).toBe(null);
              expect(renderHookResult.result.current.loading).toBe(false);
              expect(renderHookResult.result.current.data).toBe("2nd resolved");
            });
          });
        });

        describe("the first query resolves", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred.resolve("resolved");
            });
          });

          it("should return loading=true and data=null", () => {
            expect(renderHookResult.result.current.error).toBe(null);
            expect(renderHookResult.result.current.loading).toBe(true);
            expect(renderHookResult.result.current.data).toBe(null);
          });

          describe("the second query resolves", () => {
            beforeEach(async () => {
              await act(async () => {
                deferred2.resolve("2nd resolved");
              });
            });

            it("should return with data from the second query", () => {
              expect(renderHookResult.result.current.error).toBe(null);
              expect(renderHookResult.result.current.loading).toBe(false);
              expect(renderHookResult.result.current.data).toBe("2nd resolved");
            });
          });
        });
        describe("the first query rejects", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred.reject("rejected");
            });
          });
          it("should return loading=true and data=null", () => {
            expect(renderHookResult.result.current.loading).toBe(true);
            expect(renderHookResult.result.current.data).toBe(null);
          });
          it("should not return an error or call onError", () => {
            expect(renderHookResult.result.current.error).toBe(null);
            expect(onError).toHaveBeenCalledTimes(0);
          });
        });
      });
    });

    describe("is called with skip set to true", () => {
      let renderHookResult: RenderHookResult<
        QueryOptionsWithVariables<string, { option: string }>,
        QueryResult<string, { option: string }>
      >;
      beforeEach(() => {
        renderHookResult = renderHook<
          QueryOptionsWithVariables<string, { option: string }>,
          QueryResult<string, { option: string }>
        >(
          (options) => useQuery<string, { option: string }>(mockQuery, options),
          { initialProps: { skip: true } }
        );
      });
      it("should start with loading set to false", async () => {
        expect(mockQuery).toHaveBeenCalledTimes(0);
        expect(renderHookResult.result.current.error).toBe(null);
        expect(renderHookResult.result.current.loading).toBe(false);
        expect(renderHookResult.result.current.data).toBe(null);
        expect(renderHookResult.result.all.length).toBe(1);
      });
      describe("is called again with skip not set", () => {
        beforeEach(() => {
          renderHookResult.rerender({ variables: { option: "run2" } });
        });
        it("should set loading to true", () => {
          expect(mockQuery).toHaveBeenCalledWith({ option: "run2" });
          expect(mockQuery).toHaveBeenCalledTimes(1);
          expect(renderHookResult.result.current.error).toBe(null);
          expect(renderHookResult.result.current.loading).toBe(true);
          expect(renderHookResult.result.current.data).toBe(null);
          expect(renderHookResult.result.all.length).toBe(2);
        });
        describe("the query resolves", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred.resolve("resolved");
            });
          });
          it("should return with loading set to false", () => {
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(renderHookResult.result.current.error).toBe(null);
            expect(renderHookResult.result.current.loading).toBe(false);
            expect(renderHookResult.result.current.data).toBe("resolved");
            expect(renderHookResult.result.all.length).toBe(3);
          });
        });
      });
      // TODO: refetch with same variables
      describe("refetch is called", () => {
        beforeEach(() => {
          act(() => {
            renderHookResult.result.current.refetch({ option: "run2" });
          });
        });
        it("should call the query", () => {
          expect(mockQuery).toHaveBeenCalledWith({ option: "run2" });
          expect(mockQuery).toHaveBeenCalledTimes(1);
        });
        it("should set loading to true", () => {
          expect(renderHookResult.result.current.error).toBe(null);
          expect(renderHookResult.result.current.loading).toBe(true);
          expect(renderHookResult.result.current.data).toBe(null);
          expect(renderHookResult.result.all.length).toBe(2);
        });
        describe("the query resolves", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred.resolve("resolved");
            });
          });
          it("should return with loading set to false", () => {
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(renderHookResult.result.current.error).toBe(null);
            expect(renderHookResult.result.current.loading).toBe(false);
            expect(renderHookResult.result.current.data).toBe("resolved");
            expect(renderHookResult.result.all.length).toBe(3);
          });
        });
      });
    });
  });

  describe("when an asyncronous query without variables", () => {
    let deferred: Deferred<string>;
    const mockQuery = jest.fn<Promise<string>, never>();

    beforeEach(() => {
      deferred = new Deferred<string>();
      mockQuery.mockReturnValue(deferred.promise);
    });
    afterEach(() => {
      mockQuery.mockReset();
    });

    describe("is called without variables", () => {
      let renderHookResult: RenderHookResult<
        QueryOptions<string>,
        QueryResult<string, never>
      >;
      beforeEach(() => {
        renderHookResult = renderHook<
          QueryOptions<string>,
          QueryResult<string, never>
        >(() => useQuery<string>(mockQuery));
      });
      it("should start with loading set to true", async () => {
        expect(mockQuery).toHaveBeenCalled();
        expect(mockQuery).toHaveBeenCalledTimes(1);
        expect(renderHookResult.result.current.error).toBe(null);
        expect(renderHookResult.result.current.loading).toBe(true);
        expect(renderHookResult.result.current.data).toBe(null);
        expect(renderHookResult.result.all.length).toBe(1);
      });
    });
  });
});
