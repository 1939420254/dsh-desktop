declare module '*.css?raw' {
  const content: string
  export default content
}

declare module '*.png' {
  const path: string
  export default path
}
