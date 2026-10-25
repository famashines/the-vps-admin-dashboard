import { Button, Group, Stack, Table, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { signInUrl } from "../session";

type Student = { studentId: string; admissionNumber: string; firstName: string; lastName: string; dateOfBirth: string; guardian: { name: string; phone: string } };
type State = { status: "loading" } | { status: "failed" } | { status: "loaded"; students: Student[] };

const columns = ["Admission no.", "Name", "Date of birth", "Guardian", "Phone"];
const showDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export function Students() {
  const [state, setState] = useState<State>({ status: "loading" });
  const registered = (useLocation().state as { registered?: { studentId: string; admissionNumber: string; name: string } } | null)?.registered;

  useEffect(() => {
    fetch("/api/students")
      .then(async (response) => {
        if (response.status === 401) return location.assign(signInUrl());
        setState(response.ok ? { status: "loaded", students: await response.json() } : { status: "failed" });
      })
      .catch(() => setState({ status: "failed" }));
  }, []);

  const message =
    state.status === "loading"
      ? "Loading students."
      : state.status === "failed"
        ? "The student list did not load. Reload the page to try again."
        : state.students.length === 0
          ? "No students registered yet."
          : undefined;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={2}>Students</Title>
        <Button component={Link} to="/students/new">
          Register student
        </Button>
      </Group>
      {registered && (
        <Text className="notice" role="status">
          Registered {registered.name} as {registered.admissionNumber}.
        </Text>
      )}
      <Table.ScrollContainer minWidth={640}>
        <Table className="ruled" withRowBorders={false}>
          <Table.Thead>
            <Table.Tr>
              {columns.map((column) => (
                <Table.Th key={column}>{column}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {message ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <Text c={state.status === "failed" ? undefined : "dimmed"} className={state.status === "failed" ? "error" : undefined} py="lg" role={state.status === "failed" ? "alert" : undefined}>
                    {message}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              state.status === "loaded" &&
              state.students.map((s) => (
                <Table.Tr key={s.studentId} className={s.studentId === registered?.studentId ? "new" : undefined}>
                  <Table.Td>{s.admissionNumber}</Table.Td>
                  <Table.Td>
                    {s.firstName} {s.lastName}
                  </Table.Td>
                  <Table.Td>{showDate(s.dateOfBirth)}</Table.Td>
                  <Table.Td>{s.guardian.name}</Table.Td>
                  <Table.Td>{s.guardian.phone}</Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
