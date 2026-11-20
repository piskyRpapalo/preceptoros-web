// Experimental contour constructors for Atlas. Angles are radians, phases are game units.
// scale is the screen transform's largest singular value, including the device pixel ratio.
const tau = 2 * Math.PI;
const maxSegments = 65536;
const methods = ['direct', 'table', 'recurrence', 'uniform', 'adaptive', 'hermite'];

function validate(arm) {
  if (!Array.isArray(arm) || !arm.every(h => Array.isArray(h) && h.length === 4 &&
    h.every(Number.isFinite) && Number.isSafeInteger(h[0]))) throw new RangeError('Invalid periodic harmonic');
}

export function coefficients(arm) {
  validate(arm);
  const byFrequency = new Map();
  function add(k, re, im) {
    const c = byFrequency.get(k) || [k, 0, 0];
    c[1] += re;
    c[2] += im;
    byFrequency.set(k, c);
  }
  for (const [k, ax, ay, phase] of arm) {
    const phi = phase * Math.PI / 32;
    const pos = (ax + ay) / 2, neg = (ax - ay) / 2;
    add(k, pos * Math.cos(phi), pos * Math.sin(phi));
    add(-k, neg * Math.cos(phi), -neg * Math.sin(phi));
  }
  return [...byFrequency.values()].filter(([,re,im]) => re !== 0 || im !== 0);
}

export function evaluate(modes, theta) {
  let x = 0, y = 0;
  for (const [k,re,im] of modes) {
    const c = Math.cos(k*theta), s = Math.sin(k*theta);
    x += re*c - im*s;
    y += re*s + im*c;
  }
  return [x,y];
}

function derivative(arm,t,order=0) {
  let x=0, y=0;
  for (const [k,ax,ay,phase] of arm) {
    const u = k*t + phase*Math.PI/32 + order*Math.PI/2, f = k**order;
    x += f*ax*Math.cos(u);
    y += f*ay*Math.sin(u);
  }
  return [x,y];
}

// Each term's derivative norm is bounded by |k|^order max(|ax|,|ay|).
function bound(arm,order) {
  return arm.reduce((sum,[k,ax,ay]) => sum + Math.abs(k)**order*Math.max(Math.abs(ax),Math.abs(ay)),0);
}

function grid(n) {
  if (!Number.isSafeInteger(n) || n<1 || n>maxSegments) throw new RangeError('Contour exceeds grid budget');
  return Array.from({length:n+1}, (_,i) => (i/n)*tau);
}

function gridSynthesis(arm, angles, method) {
  const n = angles.length-1, modes = coefficients(arm);
  const table = method === 'table' ? angles.map(t => [Math.cos(t),Math.sin(t)]) : null;
  const rotations = modes.map(([k]) => [Math.cos(k*tau/n),Math.sin(k*tau/n)]);
  const state = modes.map(() => [1,0]);
  return angles.map((t,i) => {
    let x=0, y=0;
    modes.forEach(([k,re,im],j) => {
      let rotor;
      if (table) {
        const bin = ((k%n)*i)%n;
        rotor = table[bin<0 ? bin+n : bin];
      } else {
        rotor = state[j];
        if (i%32===0) {
          rotor[0] = Math.cos(k*t);
          rotor[1] = Math.sin(k*t);
        }
      }
      const [c,s] = rotor;
      x += re*c-im*s;
      y += re*s+im*c;
      if (!table) {
        const [dc,ds] = rotations[j];
        rotor[0] = c*dc-s*ds;
        rotor[1] = s*dc+c*ds;
      }
    });
    return [x,y];
  });
}

function adaptiveAngles(arm,scale,epsilon) {
  const m2=bound(arm,2), m3=bound(arm,3), angles=[0];
  function split(a,b,depth) {
    const h=b-a, mid=(a+b)/2;
    // Lipschitz bound on the whole interval, including interior peaks.
    const local = Math.min(m2, Math.hypot(...derivative(arm,mid,2)) + m3*h/2);
    if (scale*local*h*h/8 <= epsilon) {
      if (angles.length>maxSegments) throw new RangeError('Contour exceeds grid budget');
      angles.push(b);
    } else {
      if (depth>=32) throw new RangeError('Contour exceeds subdivision budget');
      split(a,mid,depth+1);
      split(mid,b,depth+1);
    }
  }
  split(0,tau,0);
  return angles;
}

export function contour(arm,{method='direct',scale=1,epsilon=.5,segments=220}={}) {
  validate(arm);
  if (!methods.includes(method) || !Number.isFinite(scale) || scale<0 ||
      !Number.isFinite(epsilon) || epsilon<=0) throw new RangeError('Invalid contour options');
  let angles;
  if (method==='adaptive') angles = adaptiveAngles(arm,scale,epsilon);
  else {
    if (method==='hermite' || method==='uniform') {
      // For any unit projection the scalar Hermite remainder is bounded by M4*h^4/384.
      // Taking the supremum over directions gives the same Euclidean bound.
      const order = method==='hermite' ? 4 : 2;
      const divisor = order===4 ? 384 : 8;
      segments = Math.max(1, Math.ceil(tau*(scale*bound(arm,order)/(divisor*epsilon))**(1/order)));
    }
    angles = grid(segments);
  }
  const points = method==='table' || method==='recurrence' ? gridSynthesis(arm,angles,method) :
    angles.map(t => derivative(arm,t));
  points[points.length-1] = points[0].slice();
  const curves=[];
  if (method==='hermite') {
    const tangent=angles.map(t=>derivative(arm,t,1));
    for (let i=0;i<points.length-1;i++) {
      const third=(angles[i+1]-angles[i])/3, end=points[i+1];
      curves.push([points[i].map((v,k)=>v+third*tangent[i][k]),
        end.map((v,k)=>v-third*tangent[i+1][k]),end]);
    }
  }
  return {angles,points,curves};
}
