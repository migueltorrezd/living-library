/**
 * Book catalogue.
 *
 * Selected demonstration titles. Publisher artwork and edition measurements are
 * recorded separately in model-manifest.json and the asset provenance.
 * Legacy shader fields remain for compatible fallback components.
 */

export type Book = {
  slug: string;
  title: string;
  author: string;
  description: string;
  /** Cloth binding colour. Also drives the DOM row background. */
  cloth: string;
  /** Foil stamping colour (gold, silver, copper). */
  foil: string;
  /** Type colour printed on the cover. */
  ink: string;
  /** Spine width in world units. Base geometry is 3.374. */
  thickness: number;
};

// Smallest cover area first, largest at the bottom of the shelf.
export const BOOKS: Book[] = [
  {
    "slug": "meditations",
    "title": "Meditations",
    "author": "Marcus Aurelius",
    "description": "Private notes from a working emperor on attention, duty, and the shortness of the whole business.",
    "cloth": "#24384F",
    "foil": "#C9D1D9",
    "ink": "#EAF0F5",
    "thickness": 1.6
  },
  {
    "slug": "zarathustra",
    "title": "Thus Spoke Zarathustra",
    "author": "Friedrich Nietzsche",
    "description": "A book for everyone and nobody, written in aphorism and song against the comfort of inherited values.",
    "cloth": "#8C3A1E",
    "foil": "#E8C07A",
    "ink": "#FBEEDF",
    "thickness": 3
  },
  {
    "slug": "art-of-war",
    "title": "The Art of War",
    "author": "Sun Tzu",
    "description": "Thirteen chapters on terrain, deception, and winning before the first move is made.",
    "cloth": "#1B1B1F",
    "foil": "#C1443C",
    "ink": "#EDE8E2",
    "thickness": 1.2
  },
  {
    "slug": "origin-of-species",
    "title": "On the Origin of Species",
    "author": "Charles Darwin",
    "description": "Descent with modification, and the long argument that variation plus selection is enough to explain the living world.",
    "cloth": "#6B2226",
    "foil": "#C9A227",
    "ink": "#F5E9DC",
    "thickness": 3.4
  },
  {
    "slug": "wealth-of-nations",
    "title": "The Wealth of Nations",
    "author": "Adam Smith",
    "description": "The division of labour, the pin factory, and the invisible hand that ties self-interest to public benefit.",
    "cloth": "#1F4034",
    "foil": "#D9B26A",
    "ink": "#F2ECDD",
    "thickness": 4.4
  },
  {
    "slug": "the-republic",
    "title": "The Republic",
    "author": "Plato",
    "description": "Justice, the cave, and the still-unanswered question of who should be trusted to rule.",
    "cloth": "#1C4A4A",
    "foil": "#CBB279",
    "ink": "#E8F1EF",
    "thickness": 4
  },
  {
    "slug": "naval",
    "title": "The Almanack of Naval Ravikant",
    "author": "Eric Jorgenson",
    "description": "Naval Ravikant’s reflections on wealth, judgement and happiness, gathered into a guide for thinking independently.",
    "cloth": "#f6f6f3",
    "foil": "#242725",
    "ink": "#242725",
    "thickness": 3.05
  },
  {
    "slug": "the-book-of-elon",
    "title": "The Book of Elon",
    "author": "Eric Jorgenson",
    "description": "A collection of Elon Musk’s ideas on work, invention and ambitious projects, curated by Eric Jorgenson.",
    "cloth": "#e51a35",
    "foil": "#fff3dc",
    "ink": "#fff3dc",
    "thickness": 2.54
  },
  {
    "slug": "how-to-fail",
    "title": "How to Fail at Almost Everything and Still Win Big",
    "author": "Scott Adams",
    "description": "A personal account of failure, useful combinations of skills, and the daily systems that make progress possible.",
    "cloth": "#6da5cd",
    "foil": "#ffffff",
    "ink": "#ffffff",
    "thickness": 1.7
  },
  {
    "slug": "walden",
    "title": "Walden",
    "author": "Henry David Thoreau",
    "description": "Two years by a pond, and a careful accounting of what a life actually costs.",
    "cloth": "#3F4A2A",
    "foil": "#D2C08C",
    "ink": "#F1F0E2",
    "thickness": 2.2
  },
  {
    "slug": "le-petit-prince",
    "title": "Le Petit Prince",
    "author": "Antoine de Saint-Exupéry",
    "description": "A pilot meets a traveller from a tiny planet, and learns to see friendship, love and responsibility with new eyes.",
    "cloth": "#eeeadc",
    "foil": "#8f8044",
    "ink": "#8f8044",
    "thickness": 1.1
  },
  {
    "slug": "cien-anos-de-soledad",
    "title": "Cien años de soledad",
    "author": "Gabriel García Márquez",
    "description": "The lives of the Buendía family unfold through love, solitude and extraordinary events in the town of Macondo.",
    "cloth": "#174b45",
    "foil": "#f5debf",
    "ink": "#f5debf",
    "thickness": 3.2
  },
  {
    "slug": "principia",
    "title": "Principia",
    "author": "Isaac Newton",
    "description": "Three laws, universal gravitation, and the geometry that turned the heavens into a solvable problem.",
    "cloth": "#3D2B4F",
    "foil": "#D8C48A",
    "ink": "#F0E9F2",
    "thickness": 5.1
  }
];
