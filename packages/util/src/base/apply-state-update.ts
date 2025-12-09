import { isFunction } from "./util";

export type StateUpdate<T> = Partial<T> | ((prev: T) => Partial<T>);

export const applyStateUpdate = <T>(
  prevState: T,
  update: StateUpdate<T>,
): T => {
  const next = isFunction(update) ? update(prevState) : update;
  return { ...prevState, ...next };
};
