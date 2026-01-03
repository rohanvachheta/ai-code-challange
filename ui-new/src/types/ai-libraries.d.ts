// Type declarations for AI libraries that may not have built-in TypeScript support

declare module 'soundex' {
  function soundex(str: string): string;
  export = soundex;
}

declare module 'fast-levenshtein' {
  export interface LevenshteinStatic {
    get(first: string, second: string): number;
  }
  
  const levenshtein: LevenshteinStatic;
  export = levenshtein;
}

declare module 'trie-search' {
  export default class TrieSearch<T> {
    constructor(keyFields?: string | string[]);
    add(item: T): void;
    addAll(items: T[]): void;
    search(query: string): T[];
    reset(): void;
  }
}

// Extend existing compromise types if needed
declare module 'compromise' {
  interface Document {
    nouns(): Document;
    verbs(): Document;
    numbers(): Document;
    places(): Document;
    out(format: 'array'): string[];
  }
  
  function nlp(text: string): Document;
  export = nlp;
}