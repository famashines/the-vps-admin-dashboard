import { Button, Table, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Icon } from "../icons";
import { gradeLabel } from "../school.ts";
import { EnrollDialog, type Enrollment } from "./EnrollDialog";
import { signInUrl } from "../session";

type Student = { studentId: string; admissionNumber: string; firstName: string; lastName: string; dateOfBirth: string; guardian: { name: string; phone: string }; enrollments: Enrollment[] };
type State = { status: "loading" } | { status: "failed" } | { status: "loaded"; students: Student[] };

const columns = ["Admission no.", "Name", "Class", "Date of birth", "Guardian", "Phone"];
const showDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

function Empty({ status }: { status: "loading" | "failed" | "empty" }) {
  if (status === "loading") return <Text className="state-text">Loading students.</Text>;
  if (status === "failed")
    return (
      <>
        <Text className="state-title error" role="alert">
          The student list did not load.
        </Text>
        <Text className="state-text">Check the connection, then reload the page.</Text>
        <Button variant="default" mt="md" onClick={() => location.reload()}>
          Reload page
        </Button>
      </>
    );
  return (
    <>
      <Text className="state-title">No students registered yet.</Text>
      <Text className="state-text">Register the first student. The admission number is given on save.</Text>
      <Button component={Link} to="/students/new" mt="md" leftSection={<Icon name="add" size={16} />}>
        Register student
      </Button>
    </>
  );
}

export function Students() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [enrolling, setEnrolling] = useState<{ studentId: string; name: string }>();
  const [enrolled, setEnrolled] = useState<string>();
  const registered = (useLocation().state as { registered?: { studentId: string; admissionNumber: string; name: string } } | null)?.registered;

  useEffect(() => {
    fetch("/api/students")
      .then(async (response) => {
        if (response.status === 401) return location.assign(signInUrl());
        setState(response.ok ? { status: "loaded", students: await response.json() } : { status: "failed" });
      })
      .catch(() => setState({ status: "failed" }));
  }, []);

  const empty = state.status === "loaded" ? (state.students.length === 0 ? "empty" : undefined) : state.status;
  const count = state.status === "loaded" && state.students.length > 0 ? state.students.length : undefined;

  return (
    <>
      <header className="page-head">
        <div>
          <Title order={1}>Students</Title>
          <Text className="lead">{count ? `${count} registered` : "Every student registered at the school office."}</Text>
        </div>
        <Button component={Link} to="/students/new" leftSection={<Icon name="add" size={16} />}>
          Register student
        </Button>
      </header>
      {enrolled && (
        <div className="notice" role="status">
          <Icon name="check" />
          <Text>{enrolled}</Text>
        </div>
      )}
      {registered && !enrolled && (
        <div className="notice" role="status">
          <Icon name="check" />
          <Text>
            Registered {registered.name} as <strong>{registered.admissionNumber}</strong>.
          </Text>
        </div>
      )}
      <div className="panel panel-flush">
        {empty ? (
          <div className="state">
            <Empty status={empty} />
          </div>
        ) : (
          state.status === "loaded" && (
            <Table.ScrollContainer minWidth={640} type="native">
              <Table className="ruled" withRowBorders={false}>
                <Table.Thead>
                  <Table.Tr>
                    {columns.map((column) => (
                      <Table.Th key={column}>{column}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {state.students.map((s) => (
                    <Table.Tr key={s.studentId} className={s.studentId === registered?.studentId ? "new" : undefined}>
                      <Table.Td className="adm">{s.admissionNumber}</Table.Td>
                      <Table.Td className="name">
                        {s.firstName} {s.lastName}
                      </Table.Td>
                      <Table.Td>
                        {s.enrollments[0] ? (
                          <span className="class-cell" title={s.enrollments[0].academicYearName}>
                            {gradeLabel(s.enrollments[0].grade)} {s.enrollments[0].section}
                          </span>
                        ) : (
                          <Button variant="subtle" size="compact-sm" onClick={() => setEnrolling({ studentId: s.studentId, name: `${s.firstName} ${s.lastName}` })}>
                            Enroll
                          </Button>
                        )}
                      </Table.Td>
                      <Table.Td>{showDate(s.dateOfBirth)}</Table.Td>
                      <Table.Td>{s.guardian.name}</Table.Td>
                      <Table.Td className="num">{s.guardian.phone}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )
        )}
      </div>
      <EnrollDialog
        student={enrolling}
        onClose={() => setEnrolling(undefined)}
        onEnrolled={(enrollment) => {
          if (state.status === "loaded" && enrolling) {
            setState({ status: "loaded", students: state.students.map((s) => (s.studentId === enrolling.studentId ? { ...s, enrollments: [enrollment, ...s.enrollments] } : s)) });
            setEnrolled(`Enrolled ${enrolling.name} in ${gradeLabel(enrollment.grade)} ${enrollment.section}, ${enrollment.academicYearName}.`);
          }
          setEnrolling(undefined);
        }}
      />
    </>
  );
}
