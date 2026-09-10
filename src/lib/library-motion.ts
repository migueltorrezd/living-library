/** Finite, interruptible movement. Both ends have zero velocity and acceleration. */
export const BOOK_ARRIVAL_SECONDS=.9;
export const BOOK_RETURN_SECONDS=2.8;
export function bookEase(t:number){const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10);}
