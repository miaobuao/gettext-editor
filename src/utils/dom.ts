export function travelDom(
  root: HTMLElement,
  callback: (element: HTMLElement) => bool
) {
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (callback(node)) {
      stack.push(...node.children);
    }
  }
}
