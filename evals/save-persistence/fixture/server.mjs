import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';

const port = Number(process.env.PORT || 4317);
const dataFile = new URL('./data.json', import.meta.url);
const initial = { name: 'Alex' };
async function profile() {
  try { return JSON.parse(await readFile(dataFile, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return initial; throw error; }
}
const html = `<!doctype html><html><head><title>Profile</title></head><body>
<h1>Profile</h1><form><label>Display name <input name="name" required></label>
<button>Save</button></form><p role="status"></p>
<script>
const input = document.querySelector('input');
fetch('/api/profile').then(r => r.json()).then(p => input.value = p.name);
document.querySelector('form').onsubmit = async event => {
  event.preventDefault();
  const response = await fetch('/api/profile', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: input.value})});
  document.querySelector('[role=status]').textContent = response.ok ? 'Saved' : 'Save failed';
};
</script></body></html>`;
http.createServer(async (req, res) => {
  try {
    if (req.url === '/' && req.method === 'GET') {
      res.writeHead(200, {'Content-Type': 'text/html'}); return res.end(html);
    }
    if (req.url === '/health') return res.end('ok');
    if (req.url === '/api/profile' && req.method === 'GET') {
      res.writeHead(200, {'Content-Type': 'application/json'});
      return res.end(JSON.stringify(await profile()));
    }
    if (req.url === '/api/profile' && req.method === 'POST') {
      let body = ''; for await (const chunk of req) body += chunk;
      const next = JSON.parse(body);
      if (typeof next.name !== 'string' || !next.name.trim()) {
        res.writeHead(400); return res.end('Name required');
      }
      // persist profile
      res.writeHead(200, {'Content-Type': 'application/json'});
      return res.end(JSON.stringify(next));
    }
    res.writeHead(404); res.end('Not found');
  } catch { res.writeHead(500); res.end('Request failed'); }
}).listen(port, '127.0.0.1', () => console.log(`Profile app: http://127.0.0.1:${port}`));
