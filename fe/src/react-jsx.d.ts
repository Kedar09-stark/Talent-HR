declare module 'react/jsx-runtime' {
  export function jsx(type: any, props?: any, key?: any): any;
  export function jsxs(type: any, props?: any, key?: any): any;
  export function jsxDEV(type: any, props?: any, key?: any): any;
  const _default: any;
  export default _default;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
