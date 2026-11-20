// From the WEB checkout: NODE_PATH=<playwright-core install parent> node atlas/render_landing_reel.cjs
// Offline scene, seed 62. The real crab, guardian and wave painters run in an empty Chromium tab.
const { chromium } = require('playwright-core');
const { writeFileSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

async function render() {
  const frames = mkdtempSync(join(tmpdir(), 'acho-film-'));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BINARY || '/usr/bin/google-chrome' });
  try {
    const page = await browser.newPage();
    await page.setContent('<canvas width="960" height="540"></canvas>');
    for (const script of ['values','gacha','semantic_table','comic_tokens','map_painter','wave_render','crab_body','map_fog_layer']) {
      await page.addScriptTag({ path: 'public/game/' + script + '.js' });
    }
    for (let frame = 0; frame < 192; frame++) {
      const png = await page.evaluate(frame => {
        const canvas = document.querySelector('canvas'), g = canvas.getContext('2d');
        const phase = frame / 192, angle = phase * 2 * Math.PI;
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
        // A flag changes hands for the third act. Its position closes the loop at frame 192.
        const lift=Math.max(0,Math.sin((phase-.48)*2*Math.PI));
        g.fillStyle='#eabf83'; g.fillRect(733,138,56,47);
        g.fillStyle='#162f42'; g.fillRect(754,158,14,27);
        g.beginPath(); g.moveTo(720,140); g.lineTo(761,104); g.lineTo(801,140); g.fill();
        g.fillRect(761,81,3,34);
        g.fillStyle=lift>.15?'#ffca71':'#a6cec6'; g.beginPath(); g.moveTo(764,84);
        g.lineTo(786,89); g.lineTo(764,97); g.fill();
        const ghost=Math.max(0,Math.sin((phase-.68)*Math.PI/.32));
        if(phase>.68) {g.save();g.globalAlpha=ghost;AtlasMapFog.npc(g,866-ghost*58,184,2,H,[-1,0]);g.restore();}
        const oval=(ctx,x,y,rx,ry,start,end)=>ctx.ellipse(x,y,rx,ry,0,start,end);
        for(let i=0;i<3;i++) {
          const stride=phase*16+i;
          const x=85+48*i+42*(1-Math.cos(angle))+ghost*(i-1)*15;
          const y=366+18*i-28*Math.sin(angle);
          AtlasCrabBody.draw(g,x,y,1.4,AtlasCrabBody.pose(Math.floor(stride),stride%1,1),H,.45,oval);
        }
        const duel=Math.max(0,Math.sin((phase-.2)*Math.PI/.34));
        if(phase>.2 && phase<.54) for(let i=0;i<2;i++) {
          AtlasOnda.dibuja(g,[[1,16,13,0],[5,7,5,62+i]],662+i*90+(1-2*i)*32*duel,225,26*duel,
            {giro:angle*2,calidad:0,color:[i?38:170,85,70],alfa:duel});
        }
        return canvas.toDataURL().split(',')[1];
      },frame);
      writeFileSync(join(frames,String(frame).padStart(3,'0')+'.png'),Buffer.from(png,'base64'));
    }
    const output='public/assets/landing-acho';
    execFileSync('ffmpeg',['-loglevel','error','-y','-framerate','16','-i',join(frames,'%03d.png'),'-c:v','libvpx-vp9','-crf','34','-b:v','0','-pix_fmt','yuv420p',output+'.webm']);
    execFileSync('ffmpeg',['-loglevel','error','-y','-i',join(frames,'062.png'),output+'.webp']);
  } finally { await browser.close(); rmSync(frames,{recursive:true,force:true}); }
}
render().catch(error=>{console.error(error);process.exitCode=1;});
