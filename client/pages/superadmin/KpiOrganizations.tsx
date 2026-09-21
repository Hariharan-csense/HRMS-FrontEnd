import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ENDPOINTS from "@/lib/endpoint";

type KpiOrganization = {
  id: number;
  kpi_user_count: number;
  company_name: string;
};

export default function KpiOrganizations() {
  const [organizations, setOrganizations] = useState<KpiOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    ENDPOINTS.getKpiOrganizations()
      .then((response) => {
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error("Invalid organization response");
        }
        if (active) setOrganizations(response.data.data);
      })
      .catch(() => {
        if (active) setError("Unable to load KPI organizations. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [attempt]);

  const query = search.trim().toLowerCase();
  const filtered = organizations.filter((organization) =>
    organization.company_name.toLowerCase().includes(query),
  );

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">KPI Organizations</h1>
          <p className="text-muted-foreground">Number of users with KPI scorecards in each organization.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Organizations using KPI</CardTitle>
            {!loading && !error && (
              <CardDescription>{organizations.length} organization{organizations.length === 1 ? "" : "s"}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              aria-label="Search KPI organizations"
              placeholder="Search by organization name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-md"
            />
            {loading ? (
              <p role="status" className="py-8 text-center text-muted-foreground">Loading organizations...</p>
            ) : error ? (
              <div role="alert" className="space-y-3 py-8 text-center">
                <p>{error}</p>
                <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>Try again</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-right">KPI Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((organization) => (
                    <TableRow key={organization.id}>
                      <TableCell className="font-medium">{organization.company_name}</TableCell>
                      <TableCell className="text-right tabular-nums">{organization.kpi_user_count}</TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && (
                    <TableRow>
                      <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                        {organizations.length ? "No organizations match your search." : "No organizations have created KPI scorecards yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
