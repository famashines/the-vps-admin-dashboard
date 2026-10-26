import { Button, Group, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toLocal } from "../phone.ts";
import { Icon } from "../icons";
import { gradeLabel, showDate } from "../school.ts";
import { signInUrl } from "../session";
import type { Student } from "./Students";

const relations: Record<string, string> = { father: "Father", mother: "Mother", guardian: "Guardian" };

export function StudentPage() {
  const { studentId } = useParams();
  const [student, setStudent] = useState<Student | "missing" | "failed">();

  useEffect(() => {
    fetch("/api/students")
      .then(async (r) => {
        if (r.status === 401) return location.assign(signInUrl());
        if (!r.ok) return setStudent("failed");
        setStudent(((await r.json()) as Student[]).find((s) => s.studentId === studentId) ?? "missing");
      })
      .catch(() => setStudent("failed"));
  }, [studentId]);

  if (student === undefined) return <Text className="state-text">Loading the student.</Text>;
  if (typeof student !== "object")
    return (
      <div className="panel state">
        <Text className="state-title error" role="alert">
          {student === "missing" ? "This student does not exist." : "The student did not load."}
        </Text>
        <Text className="state-text">{student === "missing" ? "Find the student in the list." : "Check the connection, then reload the page."}</Text>
        <Button component={Link} to="/students" variant="default" mt="md">
          Back to students
        </Button>
      </div>
    );

  const name = `${student.firstName} ${student.lastName}`;
  const enrollment = student.enrollments[0];

  return (
    <>
      <Link to="/students" className="back-link">
        <Icon name="back" size={16} />
        Students
      </Link>
      <header className="page-head">
        <div>
          <Title order={1}>{name}</Title>
          <Text className="lead">
            <span className="adm-mark">{student.admissionNumber}</span>
            {enrollment ? (
              <>
                <Link to={`/classes/${enrollment.classId}`}>{gradeLabel(enrollment.grade)}</Link>, {enrollment.academicYearName}
              </>
            ) : (
              "Not in a class yet"
            )}
          </Text>
        </div>
        <Group gap="sm">
          <Button component={Link} to={`/students/${student.studentId}/fees`} variant="default" leftSection={<Icon name="fees" size={16} />}>
            Fee account
          </Button>
          <Button component={Link} to={`/students/${student.studentId}/edit`}>
            Edit details
          </Button>
        </Group>
      </header>
      <section className="panel" aria-label={`Details of ${name}`}>
        <dl className="facts">
          <div>
            <dt>Father name</dt>
            <dd>{student.fatherName ?? "Not given"}</dd>
          </div>
          <div>
            <dt>Date of birth</dt>
            <dd>{showDate(student.dateOfBirth)}</dd>
          </div>
          <div>
            <dt>Gender</dt>
            <dd>{student.gender === "female" ? "Female" : "Male"}</dd>
          </div>
          <div>
            <dt>Guardian</dt>
            <dd>
              {student.guardian.name}, {relations[student.guardian.relation] ?? student.guardian.relation}
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd className="num">
              <a href={`tel:${student.guardian.phone}`}>{toLocal(student.guardian.phone)}</a>
            </dd>
          </div>
          <div>
            <dt>Classes</dt>
            <dd>
              {student.enrollments.length === 0
                ? "Not enrolled"
                : student.enrollments.map((e) => (
                    <span key={e.enrollmentId} className="fact-line">
                      <Link to={`/classes/${e.classId}`}>{gradeLabel(e.grade)}</Link>, {e.academicYearName}
                    </span>
                  ))}
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
