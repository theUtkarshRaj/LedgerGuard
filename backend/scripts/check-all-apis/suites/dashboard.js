/**
 * Dashboard routes (authenticated viewer).
 */
module.exports = async function runDashboard(ctx, state) {
  let r = await ctx.json("/api/dashboard/overview?limit=3", {
    headers: { Authorization: `Bearer ${state.viewerTok}` },
  });
  if (
    r.status === 200 &&
    r.json?.data?.summary &&
    Array.isArray(r.json?.data?.categories) &&
    Array.isArray(r.json?.data?.recent)
  ) {
    ctx.pass("GET /api/dashboard/overview");
  } else {
    ctx.fail("GET /api/dashboard/overview", `got ${r.status}`);
  }

  const paths = [
    "/api/dashboard/summary",
    "/api/dashboard/categories",
    "/api/dashboard/recent?limit=3",
    "/api/dashboard/trends?granularity=month",
  ];

  for (const path of paths) {
    const r = await ctx.json(path, {
      headers: { Authorization: `Bearer ${state.viewerTok}` },
    });
    if (r.status === 200 && r.json?.data !== undefined) {
      ctx.pass(`GET ${path.split("?")[0]}`);
    } else {
      ctx.fail(`GET ${path}`, `got ${r.status}`);
    }
  }

  const r = await ctx.json("/api/dashboard/trends?granularity=week", {
    headers: { Authorization: `Bearer ${state.viewerTok}` },
  });
  if (r.status === 200 && Array.isArray(r.json?.data)) {
    ctx.pass("GET /api/dashboard/trends?granularity=week");
  } else {
    ctx.fail("GET trends week", `got ${r.status}`);
  }
};
