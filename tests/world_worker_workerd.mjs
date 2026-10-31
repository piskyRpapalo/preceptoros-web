import {worldState} from './world_state.mjs';
export default {
  async test(controller, env) {
    let threw = false;
    try { new Request('https://example.org/', {redirect:'error'}); } catch (e) { threw = e instanceof TypeError; }
    if (!threw) throw new Error('Expected Cloudflare rejection of redirect:error');
    const response = await worldState(new Request('https://example.org/api/world-state'), env);
    if (response.status !== 200) throw new Error('Expected successful response from service binding: ' + await response.text());
    const parsed = await response.json();
    if (parsed.esquema !== 'preceptoros.openworld-estado/2') throw new Error('Invalid response');
  }
};
