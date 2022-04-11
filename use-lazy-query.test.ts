import {
  renderHook,
  act,
  RenderHookResult,
} from "@testing-library/react-hooks";
import { Result, useLazyQuery } from "./use-lazy-query";

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

describe("useLazyQuery", () => {
  describe("when an asyncronous query", () => {
    let deferred: Deferred<string>;
    const mockQuery = jest.fn();

    beforeEach(() => {
      deferred = new Deferred<string>();
      mockQuery.mockReturnValue(deferred.promise);
    });
    afterEach(() => {
      mockQuery.mockReset();
    });

    describe("is called with variables", () => {
      let renderHookResult: RenderHookResult<any, Result<string, string>>;
      const onCompleted = jest.fn();
      const onError = jest.fn();
      beforeEach(() => {
        renderHookResult = renderHook(
          (options) => useLazyQuery(mockQuery, options),
          { initialProps: { variables: "run1", onCompleted, onError } }
        );
      });
      it("should start with loading set to false", async () => {
        expect(mockQuery).toHaveBeenCalledTimes(0);
        expect(renderHookResult.result.current[1].error).toBe(null);
        expect(renderHookResult.result.current[1].loading).toBe(false);
        expect(renderHookResult.result.current[1].data).toBe(null);
        expect(renderHookResult.result.all.length).toBe(1);
      });
      describe("refetch is called", () => {
        beforeEach(() => {
          renderHookResult.result.current[1].refetch("run2");
        });
        it("should call the query", () => {
          expect(mockQuery).toHaveBeenCalledWith("run2");
          expect(mockQuery).toHaveBeenCalledTimes(1);
        });
        describe("useLazyQuery is called again", () => {
          beforeEach(() => {
            renderHookResult.rerender();
          });
          it("should set loading to true", () => {
            expect(renderHookResult.result.current[1].error).toBe(null);
            expect(renderHookResult.result.current[1].loading).toBe(true);
            expect(renderHookResult.result.current[1].data).toBe(null);
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
              expect(renderHookResult.result.current[1].error).toBe(null);
              expect(renderHookResult.result.current[1].loading).toBe(false);
              expect(renderHookResult.result.current[1].data).toBe("resolved");
              expect(renderHookResult.result.all.length).toBe(3);
            });
          });
        });
      });
    });
  });
});
