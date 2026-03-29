export const createIdGenerator = (): (() => number) => {
  let counter = 1;
  return (): number => counter++;
};
