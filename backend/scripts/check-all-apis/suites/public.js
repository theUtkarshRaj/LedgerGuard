/**
 * Unauthenticated and registration checks.
 */
module.exports = async function runPublic(ctx, _state) {
  let r = await ctx.json("/");
  if (r.status === 200 && r.json?.name === "LedgerGuard") ctx.pass("GET /");
  else ctx.fail("GET /", `status ${r.status}`);

  r = await ctx.json("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nope@x.co", password: "wrong" }),
  });
  if (r.status === 401) ctx.pass("POST /api/auth/login (bad creds → 401)");
  else ctx.fail("POST /api/auth/login bad", `got ${r.status}`);

  r = await ctx.json("/api/auth/me", { headers: {} });
  if (r.status === 401) ctx.pass("GET /api/auth/me (no token → 401)");
  else ctx.fail("GET /api/auth/me no token", `got ${r.status}`);

  const uniq = `api_check_${Date.now()}@demo.local`;
  r = await ctx.json("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "API Check User",
      email: uniq,
      password: "ChangeMe!123",
    }),
  });
  if (r.status === 201 && r.json?.data?.email === uniq) ctx.pass("POST /api/auth/register");
  else ctx.fail("POST /api/auth/register", `${r.status} ${r.raw?.slice(0, 120)}`);
};
