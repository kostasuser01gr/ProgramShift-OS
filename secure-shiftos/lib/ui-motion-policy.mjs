/** Central motion policy for operational interfaces, not cinematic marketing. */
export const UI_MOTION=Object.freeze({
  fast:0.14,
  normal:0.22,
  panel:0.26,
  lift:3,
  distance:9,
  ease:[0.22,1,0.36,1],
});
export function motionProps(kind,reduce=false){
  if(reduce)return {initial:false,animate:{opacity:1},exit:undefined,transition:{duration:0}};
  const duration=kind==='panel'?UI_MOTION.panel:kind==='notice'?UI_MOTION.fast:UI_MOTION.normal;
  return {initial:{opacity:0,y:kind==='panel'?UI_MOTION.distance:4},animate:{opacity:1,y:0},exit:{opacity:0,y:kind==='panel'?UI_MOTION.distance:0},transition:{duration,ease:UI_MOTION.ease}};
}
