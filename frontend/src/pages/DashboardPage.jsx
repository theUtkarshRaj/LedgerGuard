import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { fetchDashboardData } from "../services/dashboardApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CHART, tooltipMoneyLabel } from "../chartSetup";

function money(s) {
  if (s == null) return "—";
  const n = Number(s);
  if (Number.isFinite(n))
    return n.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  return s;
}

const axisCommon = {
  ticks: { color: CHART.muted, maxRotation: 45, minRotation: 0 },
  grid: { color: CHART.grid },
  border: { color: CHART.grid },
};

export default function DashboardPage() {
  const { setUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      setError("");
      setLoading(true);
      try {
        const response = await fetchDashboardData({ signal: controller.signal });
        if (cancelled) return;
        
        const { summary: s, categories: c, recent: r, user } = response.data;
        
        if (user) {
          setUser(user);
        }
        
        setSummary(s ?? null);
        setCategories(Array.isArray(c) ? c : []);
        setRecent(Array.isArray(r) ? r : []);
      } catch (e) {
        if (!cancelled && e.name !== "AbortError") {
          setError(e.message || "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [setUser]);

  const incomeTotal = Number(summary?.totalIncome || 0);
  const expenseTotal = Number(summary?.totalExpense || 0);
  const hasFlow = incomeTotal + expenseTotal > 0;

  const pieData = useMemo(
    () => ({
      labels: ["Income", "Expense"],
      datasets: [
        {
          data: [incomeTotal, expenseTotal],
          backgroundColor: [CHART.income, CHART.expense],
          borderColor: [CHART.incomeSolid, CHART.expenseSolid],
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    }),
    [incomeTotal, expenseTotal]
  );

  const categoryBarData = useMemo(() => {
    const labels = categories.map((c) => c.category);
    return {
      labels,
      datasets: [
        {
          label: "Income",
          data: categories.map((c) => Number(c.income || 0)),
          backgroundColor: CHART.income,
          borderColor: CHART.incomeSolid,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Expense",
          data: categories.map((c) => Number(c.expense || 0)),
          backgroundColor: CHART.expense,
          borderColor: CHART.expenseSolid,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [categories]);

  const pieOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: CHART.muted, padding: 14, usePointStyle: true },
        },
        tooltip: {
          callbacks: { label: tooltipMoneyLabel },
        },
      },
    }),
    []
  );

  const categoryBarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: { color: CHART.muted, usePointStyle: true, boxWidth: 8 },
        },
        tooltip: {
          callbacks: { label: tooltipMoneyLabel },
        },
      },
      scales: {
        x: {
          ...axisCommon,
          stacked: false,
          ticks: {
            ...axisCommon.ticks,
            callback: (v) =>
              Number(v).toLocaleString(undefined, {
                notation: v >= 1e6 ? "compact" : "standard",
                maximumFractionDigits: 0,
              }),
          },
        },
        y: { ...axisCommon, stacked: false },
      },
    }),
    []
  );

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="banner error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page dashboard">
      <header className="page-head dashboard-head">
        <h1>Dashboard</h1>
      </header>

      <section className="grid stats">
        <div className="stat card">
          <span className="stat-label">Total income</span>
          <strong className="stat-value income">
            {money(summary?.totalIncome)}
          </strong>
        </div>
        <div className="stat card">
          <span className="stat-label">Total expenses</span>
          <strong className="stat-value expense">
            {money(summary?.totalExpense)}
          </strong>
        </div>
        <div className="stat card">
          <span className="stat-label">Net balance</span>
          <strong className="stat-value">{money(summary?.netBalance)}</strong>
        </div>
      </section>

      <section className="grid charts-row">
        <div className="card section chart-card">
          <h2>Income vs expense</h2>
          <p className="chart-sub muted">Share of totals (doughnut)</p>
          <div className="chart-canvas chart-canvas--pie">
            {hasFlow ? (
              <Doughnut data={pieData} options={pieOptions} />
            ) : (
              <p className="muted chart-empty">No transactions yet.</p>
            )}
          </div>
        </div>
        <div className="card section chart-card chart-card--wide">
          <h2>By category</h2>
          <p className="chart-sub muted">Horizontal bars — income & expense</p>
          <div className="chart-canvas chart-canvas--tall">
            {categories.length > 0 ? (
              <Bar data={categoryBarData} options={categoryBarOptions} />
            ) : (
              <p className="muted chart-empty">No category data.</p>
            )}
          </div>
        </div>
      </section>

      <section className="card section dashboard-recent">
        <h2>Recent activity</h2>
        <div className="table-wrap">
          <table className="table compact">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`pill ${row.type.toLowerCase()}`}>
                      {row.type}
                    </span>
                  </td>
                  <td>{row.category}</td>
                  <td className="num">{money(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && (
            <p className="muted pad">No recent entries.</p>
          )}
        </div>
      </section>
    </div>
  );
}
