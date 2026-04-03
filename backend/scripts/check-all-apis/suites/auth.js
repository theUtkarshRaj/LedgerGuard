/**
 * Login and /me with tokens.
 * Mutates state: adminTok, analystTok, viewerTok, adminId
 */
module.exports = async function runAuth(ctx, state) {
  state.adminTok = await ctx.login("admin@demo.local", "ChangeMe!123");
  state.analystTok = await ctx.login("analyst@demo.local", "ChangeMe!123");
  state.viewerTok = await ctx.login("viewer@demo.local", "ChangeMe!123");

  ctx.pass("POST /api/auth/login (admin/analyst/viewer)");

  const r = await ctx.json("/api/auth/me", {
    headers: { Authorization: `Bearer ${state.adminTok}` },
  });
  state.adminId = r.json?.data?.id;
  if (r.status === 200 && r.json?.data?.role === "ADMIN" && state.adminId) {
    ctx.pass("GET /api/auth/me (admin token)");
  } else {
    ctx.fail("GET /api/auth/me", `got ${r.status}`);
  }
};
