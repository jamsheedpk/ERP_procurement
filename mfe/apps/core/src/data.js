import { useEffect, useState } from "react";
import { API_BASE } from "@meridian/api";

const j = (path) => fetch(`${API_BASE}${path}`).then(async (r) => {
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error((body && (body.error || body.message)) || `Request failed (${r.status})`);
  return body;
});

/**
 * Cross-domain data the Reports page reads (employees, leaveRequests, payrollRun,
 * headcountTrend). The Dashboard and Permissions pages self-fetch via window.API,
 * so they don't depend on this hook.
 */
export function useCoreData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      j("/employees"), j("/leave-requests"), j("/payroll/latest"), j("/headcount/trend"),
    ]).then(([employees, leaveRequests, payrollRun, headcountTrend]) => {
      setData({
        employees: employees.map((e) => ({ ...e, id: e.empId })),
        leaveRequests: leaveRequests.map((l) => ({ ...l, id: l.leaveId })),
        payrollRun: payrollRun || {},
        headcountTrend: Array.isArray(headcountTrend) ? headcountTrend : [],
      });
    }).catch((e) => setError(e.message || "Could not load report data."));
  }, []);

  return { data, error };
}
