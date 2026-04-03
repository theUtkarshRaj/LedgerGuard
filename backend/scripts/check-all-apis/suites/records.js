/**
 * /api/records. Requires state: adminTok, analystTok, viewerTok, adminId
 * Mutates state: recordId
 */
module.exports = async function runRecords(ctx, state) {
  let r = await ctx.json("/api/records", {
    headers: { Authorization: `Bearer ${state.viewerTok}` },
  });
  if (r.status === 403) ctx.pass("GET /api/records as VIEWER → 403");
  else ctx.fail("GET /api/records viewer", `got ${r.status}`);

  r = await ctx.json("/api/records?limit=3", {
    headers: { Authorization: `Bearer ${state.analystTok}` },
  });
  if (r.status === 200 && Array.isArray(r.json?.data)) ctx.pass("GET /api/records (analyst)");
  else ctx.fail("GET /api/records analyst", `got ${r.status}`);

  r = await ctx.json("/api/records", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${state.adminTok}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: state.adminId,
      amount: "42.00",
      type: "EXPENSE",
      category: "API-Test",
      date: new Date().toISOString(),
      note: "check-all-apis",
    }),
  });
  if (r.status === 201 && r.json?.data?.id) ctx.pass("POST /api/records");
  else ctx.fail("POST /api/records", `${r.status} ${r.raw?.slice(0, 120)}`);

  state.recordId = r.json.data.id;

  r = await ctx.json("/api/records", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${state.adminTok}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: "7.50",
      type: "EXPENSE",
      category: "API-Test-DefaultOwner",
      date: new Date().toISOString(),
      note: "no userId in body",
    }),
  });
  if (
    r.status === 201 &&
    r.json?.data?.userId === state.adminId &&
    r.json?.data?.id !== state.recordId
  ) {
    ctx.pass("POST /api/records without userId → owner defaults to admin");
  } else {
    ctx.fail(
      "POST /api/records default owner",
      `${r.status} ${r.raw?.slice(0, 120)}`
    );
  }

  r = await ctx.json(`/api/records/${state.recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${state.adminTok}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note: "updated" }),
  });
  if (r.status === 200 && r.json?.data?.note === "updated") ctx.pass("PATCH /api/records/:id");
  else ctx.fail("PATCH /api/records/:id", `got ${r.status}`);

  r = await ctx.json(`/api/records/${state.recordId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${state.adminTok}` },
  });
  if (
    r.status === 200 &&
    r.json?.data?.message &&
    r.json?.data?.id === state.recordId
  ) {
    ctx.pass("DELETE /api/records/:id → 200 + message");
  } else {
    ctx.fail("DELETE /api/records/:id", `got ${r.status}`);
  }
};
