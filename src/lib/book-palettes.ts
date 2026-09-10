import type {CSSProperties} from 'react';

export type BookPalette={ground:string;ink:string;supporting:string;rule:string};

// Editorial pairs follow each publisher cover, with supporting ink and rules
// adjusted for readable contrast on that edition's field.
export const BOOK_PALETTES:Record<string,BookPalette>={
  "wealth-of-nations": {
    "ground": "#155743",
    "ink": "#f0dfa5",
    "supporting": "#cdc995",
    "rule": "#a3af83"
  },
  "origin-of-species": {
    "ground": "#e8bb56",
    "ink": "#292456",
    "supporting": "#483c56",
    "rule": "#6c5956"
  },
  "meditations": {
    "ground": "#b3dfdf",
    "ink": "#064559",
    "supporting": "#225e6e",
    "rule": "#437b88"
  },
  "art-of-war": {
    "ground": "#752735",
    "ink": "#f2d6a2",
    "supporting": "#deba91",
    "rule": "#c6997c"
  },
  "principia": {
    "ground": "#93c4d5",
    "ink": "#092b46",
    "supporting": "#1f435d",
    "rule": "#396178"
  },
  "zarathustra": {
    "ground": "#4f345b",
    "ink": "#e3e7b2",
    "supporting": "#cbcaa4",
    "rule": "#afa894"
  },
  "the-republic": {
    "ground": "#d7a08b",
    "ink": "#43202c",
    "supporting": "#5b343b",
    "rule": "#774d4d"
  },
  "walden": {
    "ground": "#e7cd72",
    "ink": "#23492f",
    "supporting": "#425e3a",
    "rule": "#687746"
  },
  "cien-anos-de-soledad": {
    "ground": "#154f48",
    "ink": "#f5d9ad",
    "supporting": "#d8c7a0",
    "rule": "#9ba285"
  },
  "le-petit-prince": {
    "ground": "#b9dce5",
    "ink": "#284e60",
    "supporting": "#3b6071",
    "rule": "#628795"
  },
  "how-to-fail": {
    "ground": "#bcdae3",
    "ink": "#243c56",
    "supporting": "#385168",
    "rule": "#617b8e"
  },
  "the-book-of-elon": {
    "ground": "#f1b9b7",
    "ink": "#6d2034",
    "supporting": "#7e3445",
    "rule": "#a25d68"
  },
  "naval": {
    "ground": "#415d58",
    "ink": "#f3e6ba",
    "supporting": "#dcd4ad",
    "rule": "#acaf93"
  }
};
export const SHELF_PALETTE:BookPalette={ground:'#201a19',ink:'#f4eee2',supporting:'#d0c2b2',rule:'#978c82'};

export function paletteStyle(palette:BookPalette):CSSProperties {
 return {'--ground':palette.ground,'--paper':palette.ink,'--supporting':palette.supporting,'--rule':palette.rule} as CSSProperties;
}
