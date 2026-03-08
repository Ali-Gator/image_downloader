export const generateImageId = (src: string, width: number, height: number): string =>
  `${src}_${width}_${height}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
