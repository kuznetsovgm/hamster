export type NotRequired<T> = {
    [P in keyof T]: T[P] | undefined;
}
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
export type PartialRequired<T, K extends keyof T> = Pick<Required<T>, K> & Omit<T, K>