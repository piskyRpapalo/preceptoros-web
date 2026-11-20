// Offline choreography in screen pixels. Each route closes at its first stop.
// Seeds control pace, length of each rest and departure time; the routes themselves
// describe where each resident lives. No visit, ledger or world clock participates.
const FRAMES = 192;
const NODE = { x:480, y:152 };
const residents = [
  ['crab', 17, 1.30, [[80,234],[241,186],[200,253]]],
  ['crab', 41, 1.65, [[93,408],[259,383],[183,327]]],
  ['crab', 83, 1.42, [[320,459],[566,475],[635,410],[429,423]]],
  ['crab', 127,1.18, [[689,358],[827,305],[794,385]]],
  ['crab', 179,1.54, [[676,154],[820,173],[727,211]]],
  ['ghost',233,1.92, [[133,144],[206,119],[174,168]]],
  ['ghost',269,2.24, [[359,178],[386,222],[312,208]]],
  ['ghost',311,1.70, [[837,449],[770,482],[869,489]]],
  ['ghost',397,2.05, [[613,258],[681,270],[633,300]]]
];
function schedule([kind, seed, size, stops]) {
  let state = seed;
  const random = () => { state = (Math.imul(state,1664525)+1013904223)>>>0; return state/4294967296; };
  const offset = random(), speed = 44+random()*36;
  let duration = 0;
  const legs = stops.map(([x,y],index) => {
    const [toX,toY] = stops[(index+1)%stops.length];
    const distance = Math.hypot(toX-x,toY-y);
    const start = duration, departure = start+.4+random()*2.3;
    duration = departure + distance/(speed*(.8+random()*.4));
    return {x,y,toX,toY,start,departure,end:duration,distance};
  });
  return {kind,seed,size,legs,duration,offset:(offset+random())%1};
}
const cast = residents.map(schedule);
function position(actor,frame) {
  const phase = ((frame % FRAMES)/FRAMES+actor.offset)%1;
  const clock = phase*actor.duration;
  const leg = actor.legs.find(leg=>clock<leg.end);
  const time = Math.max(0,(clock-leg.departure)/(leg.end-leg.departure));
  const progress = time*time*(3-2*time);
  const steps = Math.round(leg.distance/(12*actor.size))*progress;
  return {kind:actor.kind,seed:actor.seed,size:actor.size,
    x:leg.x+(leg.toX-leg.x)*progress, y:leg.y+(leg.toY-leg.y)*progress,
    rest:time===0,steps,phase};
}
function sample(frame, actors=cast) {
  const poses = actors.map(actor=>position(actor,frame));
  return poses.map(pose=>{
    // Blend near neighbours into the look at the square, avoiding sudden target switches.
    let dx=(NODE.x-pose.x)*.11, dy=(NODE.y-pose.y)*.11;
    for(const other of poses) {
      if(other===pose) continue;
      const x=other.x-pose.x,y=other.y-pose.y;
      const weight=2*Math.max(0,1-Math.hypot(x,y)/210)**2;
      dx+=weight*x;dy+=weight*y;
    }
    const len=Math.max(1,Math.hypot(dx,dy));
    return {...pose,look:{x:dx/len,y:dy/len}};
  });
}
module.exports={FRAMES,NODE,cast,sample};
