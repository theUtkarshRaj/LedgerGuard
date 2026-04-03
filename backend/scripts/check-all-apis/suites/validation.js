/**
 * Sample validation error response.
 */
module.exports = async function runValidation(ctx, state) {
  const r = await ctx.json("/api/records", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${state.adminTok}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invalid: true }),
  });
  if (r.status === 400 && r.json?.error?.message) {
    ctx.pass("POST /api/records invalid body → 400");
  } else {
    ctx.fail("validation", `got ${r.status}`);
  }
};
