export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 720 }}>
      <h1>Vidhi</h1>
      <p>
        This is a scaffold, not the compliance tracker UI yet. Real next step:
        build a table view that queries <code>/api/obligations</code> and
        renders obligations with clause citations and evidence status.
      </p>
      <p>
        See <code>README.md</code> for what&apos;s actually implemented vs.
        stubbed.
      </p>
    </main>
  );
}
