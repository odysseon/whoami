export const createIdGenerator = (): (() => string) => {
  let counter = 1;
  return (): string => String(counter++);
};
