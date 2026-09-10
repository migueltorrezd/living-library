export function DirectionIcon({kind="forward"}:{kind?:"forward"|"back"|"external"|"turn"}) {
 const path=kind==="back"?"M19 12H5m6-6-6 6 6 6":kind==="external"?"M6 18 18 6M7 6h11v11":kind==="turn"?"M5 5h10l4 4v10H5V5zm10 0v4h4M8 14h7m-3-3 3 3-3 3":"M5 12h14m-6-6 6 6-6 6";
 return <svg className="direction-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path}/></svg>;
}
