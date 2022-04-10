export function pause(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}
