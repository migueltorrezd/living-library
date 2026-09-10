import { create } from "zustand";

/** A measured DOM row, in page coordinates (viewport Y plus scroll). */
export type Row = { top: number; height: number };

type ShelfState = {
  requested: number[];
  request: (index:number) => void;
  loaded: number[];
  prepared:number[];
  preparedBook:(index:number)=>void;
  loadedBook: (index:number) => void;
  failed: number[];
  failedBook: (index:number) => void;
  retries: Record<number,number>;
  retry: (index:number) => void;
  resetReady: () => void;
  departing: {index:number;started:number} | null;
  depart: (index:number|null) => void;
  /** Filled by the DOM list. The 3D scene only ever reads this. */
  rows: Row[];
  setRows: (rows: Row[]) => void;

  hovered: number | null;
  setHovered: (index: number | null) => void;

  active: number | null;
  setActive: (index: number | null) => void;

  webgl: boolean;
  setWebgl: (v: boolean) => void;
};

export const useShelf = create<ShelfState>((set) => ({
  requested:[],
  request:index=>set(s=>s.requested.includes(index)?s:{requested:[...s.requested,index]}),
  loaded:[],loadedBook:index=>set(s=>s.loaded.includes(index)?s:{loaded:[...s.loaded,index]}),
  prepared:[],preparedBook:index=>set(s=>s.prepared.includes(index)?s:{prepared:[...s.prepared,index]}),
  failed:[],failedBook:index=>set(s=>({failed:[...s.failed,index]})),
  retries:{},retry:index=>set(s=>({failed:s.failed.filter(i=>i!==index),retries:{...s.retries,[index]:(s.retries[index]||0)+1}})),
  resetReady:()=>set({loaded:[],prepared:[],failed:[],requested:[]}),
  departing:null,depart:index=>set({departing:index===null?null:{index,started:performance.now()}}),
  rows: [],
  setRows: (rows) => set({ rows }),

  hovered: null,
  setHovered: (hovered) => set({ hovered }),

  active: null,
  setActive: (active) => set({ active }),

  // Assume yes until the feature test says otherwise, so the first paint does
  // not flash the fallback for the 99% of visitors who have WebGL.
  webgl: true,
  setWebgl: (webgl) => set({ webgl }),
}));

/** Whatever the detail panel should be showing: click wins, then hover. */
export function selectFeatured(s: ShelfState): number {
  return s.active ?? s.hovered ?? 0;
}
