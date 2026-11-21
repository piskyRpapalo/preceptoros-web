// A read-only, synthetic 24-hour Chat Live history in a LOCAL test browser only.
// Keep the Network.requestWillBeSent external-origin assertion in every harness.
// Never fixture POST/PUT or an unknown endpoint; no production API is contacted.
export const chatHistoryFixtureSource = `
  (() => {
    if (location.hostname !== '127.0.0.1') return;
    const original = window.fetch.bind(window);
    window.__chatHistoryFixtureReads = 0;
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : input && input.url;
      const method = init && init.method ? String(init.method).toUpperCase() : (input && input.method ? String(input.method).toUpperCase() : 'GET');
      if (url === 'https://api.preceptoros.org/api/v1/ingesta/dia' && method === 'GET') {
        window.__chatHistoryFixtureReads += 1;
        return Promise.resolve(new Response(JSON.stringify({ mensajes: [] }), {
          status: 200, headers: { 'content-type': 'application/json' }
        }));
      }
      return original(input, init);
    };
  })();
`;
export async function attachChatHistoryFixture(command) {
  const answer = await command('Page.addScriptToEvaluateOnNewDocument', { source: chatHistoryFixtureSource });
  if (answer && answer.error) throw Error('NO_DATA(chat_history_fixture_injection_failed)');
}
