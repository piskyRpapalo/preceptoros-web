// From the WEB checkout: NODE_PATH=<playwright-core install parent> node atlas/render_landing_reel.cjs
// The nine seeded routes are sampled offline. Only the map painters run in Chromium.

const { writeFileSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

const {FRAMES,NODE,sample} = require('./landing_colony.cjs');

function drawFrame({poses,node}) {
  const canvas = document.querySelector('canvas'), g = canvas.getContext('2d');
  const H = {...AtlasMapPainter.color, T: AtlasComicTokens};
  const sea = g.createLinearGradient(0,0,960,540);
  sea.addColorStop(0,'#112d42'); sea.addColorStop(.55,'#245d69'); sea.addColorStop(1,'#13283f');
  g.fillStyle = sea; g.fillRect(0,0,960,540);
  for (let row=-1;row<18;row++) {
    for (let col=-1;col<17;col++) {
      const x=col*69+(row&1)*34.5, y=row*33;
      g.beginPath();
      for(let i=0;i<6;i++) {
        const a=(i+.5)*Math.PI/3;
        g.lineTo(x+40*Math.cos(a),y+22*Math.sin(a));
      }
      g.closePath(); g.fillStyle='rgba(127,235,201,'+(.05+.04*Math.cos(62+row*col))+')';
      g.fill(); g.strokeStyle='#396a78'; g.stroke();
    }
  }
  const oval=(ctx,x,y,rx,ry,start,end)=>ctx.ellipse(x,y,rx,ry,0,start,end);
  const palette = AtlasComicTokens.FRONT_DOOR;
  // Colour variation stays within the house palette. Scale and gait remain
  // readable when hue is unavailable. Paint back to front, including the hall.
  const objects = [...poses,{kind:'node',...node}].sort((a,b)=>a.y-b.y);
  for(const object of objects) {
    const {kind,seed,x,y,size,look,steps,phase,rest} = object;
    if(kind==='node') {
      AtlasTownPlan.hall(g,x,y,49,.55,H,false);
      continue;
    }
    const hue=kind==='crab'?'cyan':'FIRMADO.base';
    const tint=H.mix(H.rgbOf(palette[hue]),H.rgbOf(palette['PROPUESTA.base']), (seed%11)/16);
    const colors={...H,T:{...H.T,FRONT_DOOR:{...palette,[hue]:H.css(tint)}}};
    const sway=Math.sin(2*Math.PI*phase);
    if(kind==='ghost') {
      g.save();
      g.globalAlpha=.77+.21*sway;
      AtlasMapFog.npc(g,x,y+3*sway,size,colors,[look.x,look.y]);
      g.restore();
    } else {
      const pose=AtlasCrabBody.pose(Math.floor(steps),rest?1:steps%1,1);
      pose.look=look;
      AtlasCrabBody.draw(g,x,y,size,pose,colors,.45,oval);
    }
  }
  return canvas.toDataURL().split(',')[1];
}

async function render() {
  const frames = mkdtempSync(join(tmpdir(), 'acho-film-'));
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BINARY || '/usr/bin/google-chrome' });
  try {
    const page = await browser.newPage();
    await page.setContent('<canvas width="960" height="540"></canvas>');
    for (const script of ['semantic_table','comic_tokens','map_painter','town_plan','crab_body','map_fog_layer']) {
      await page.addScriptTag({ path: 'public/game/' + script + '.js' });
    }
    for (let frame = 0; frame < FRAMES; frame++) {
      const png = await page.evaluate(drawFrame, {poses:sample(frame),node:NODE});
      writeFileSync(join(frames,String(frame).padStart(3,'0')+'.png'),Buffer.from(png,'base64'));
    }
    const output='public/assets/landing-acho';
    if (process.env.REEL_REFERENCE) require('node:fs').copyFileSync(join(frames,'062.png'),process.env.REEL_REFERENCE);
    execFileSync('ffmpeg',['-loglevel','error','-y','-framerate','16','-i',join(frames,'%03d.png'),'-c:v','libvpx-vp9','-crf','34','-b:v','0','-pix_fmt','yuv420p',output+'.webm']);
    execFileSync('ffmpeg',['-loglevel','error','-y','-i',join(frames,'062.png'),output+'.webp']);
  } finally { await browser.close(); rmSync(frames,{recursive:true,force:true}); }
}
module.exports = {drawFrame};
if (require.main === module) render().catch(error=>{console.error(error);process.exitCode=1;});
