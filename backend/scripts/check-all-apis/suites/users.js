/**
 * /api/users CRUD (ADMIN). Requires state from auth suite.
 * Mutates state: newUserId
 */
module.exports = async function runUsers(ctx, state) {
  let r = await ctx.json("/api/users", {
    headers: { Authorization: `Bearer ${state.viewerTok}` },
  });
  if (r.status === 403) ctx.pass("GET /api/users as VIEWER → 403");
  else ctx.fail("GET /api/users viewer", `got ${r.status}`);

  r = await ctx.json("/api/users?page=1&limit=5", {
    headers: { Authorization: `Bearer ${state.adminTok}` },
  });
  if (r.status === 200 && Array.isArray(r.json?.data)) ctx.pass("GET /api/users (admin)");
  else ctx.fail("GET /api/users admin", `got ${r.status}`);

  const newStaffEmail = `staff_${Date.now()}@demo.local`;
  r = await ctx.json("/api/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${state.adminTok}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Staff User",
      email: newStaffEmail,
      password: "ChangeMe!123",
      role: "ANALYST",
    }),
  });
  if (r.status === 201 && r.json?.data?.id) ctx.pass("POST /api/users");
  else ctx.fail("POST /api/users", `${r.status} ${r.raw?.slice(0, 100)}`);

  state.newUserId = r.json.data.id;

  r = await ctx.json(`/api/users/${state.newUserId}`, {
    headers: { Authorization: `Bearer ${state.adminTok}` },
  });
  if (r.status === 200 && r.json?.data?.email === newStaffEmail) ctx.pass("GET /api/users/:id");
  else ctx.fail("GET /api/users/:id", `got ${r.status}`);

  r = await ctx.json(`/api/users/${state.newUserId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${state.adminTok}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Staff Renamed" }),
  });
  if (r.status === 200 && r.json?.data?.name === "Staff Renamed") ctx.pass("PATCH /api/users/:id");
  else ctx.fail("PATCH /api/users/:id", `got ${r.status}`);
};
