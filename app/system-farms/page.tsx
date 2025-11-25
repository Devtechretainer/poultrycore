"use client";

import { useEffect, useState } from "react";
import { getFarms, getFarmCount, type FarmSummary } from "@/lib/api/system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SystemFarmsPage() {
  const [farms, setFarms] = useState<FarmSummary[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [list, total] = await Promise.all([getFarms(), getFarmCount()]);
        if (!mounted) return;
        setFarms(list ?? []);
        setCount(total ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load farms");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">System Farms</h1>
        <Badge variant="secondary">SystemAdmin only</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Farms</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{count}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Farms</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-sm text-red-600 mb-3">{error}</div>
          )}
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farm Name</TableHead>
                    <TableHead>Farm ID</TableHead>
                    <TableHead className="text-right">Total Users</TableHead>
                    <TableHead className="text-right">Staff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        No farms found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    farms.map((f) => (
                      <TableRow key={f.farmId}>
                        <TableCell className="font-medium">{f.farmName || "(No name)"}</TableCell>
                        <TableCell className="text-muted-foreground">{f.farmId}</TableCell>
                        <TableCell className="text-right">{f.totalUsers}</TableCell>
                        <TableCell className="text-right">{f.staffCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


