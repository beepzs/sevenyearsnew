async function test() {
  const res = await fetch('http://localhost:3000/about');
  const html = await res.text();
  const start = html.indexOf('<main id="main">');
  const end = html.indexOf('</main>');
  console.log('MAIN TAG CONTENT:');
  console.log(html.substring(start, start + 600));
}
test();
