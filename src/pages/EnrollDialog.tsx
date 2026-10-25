import { Button, Group, Modal, NativeSelect, Text } from "@mantine/core";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { gradeLabel, send, type Year } from "../school.ts";

export type Enrollment = { academicYearId: string; academicYearName: string; classSectionId: string; grade: string; section: string };

export function EnrollDialog({ student, onClose, onEnrolled }: {
  student: { studentId: string; name: string } | undefined;
  onClose: () => void;
  onEnrolled: (enrollment: Enrollment) => void;
}) {
  const [years, setYears] = useState<Year[]>();
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [problem, setProblem] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const select = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!student) return;
    setTitle(`Enroll ${student.name}`);
    setYears(undefined);
    setProblem(undefined);
    setKey(crypto.randomUUID());
    fetch("/api/academic-years")
      .then(async (r) => setYears(r.ok ? await r.json() : []))
      .catch(() => setYears([]));
  }, [student]);

  const sections = (years ?? []).flatMap((y) => y.sections.map((s) => ({ ...s, year: y })));

  useEffect(() => {
    if (student && sections.length) select.current?.focus();
  }, [student, sections.length]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const classSectionId = String(new FormData(event.currentTarget).get("section"));
    const chosen = sections.find((s) => s.classSectionId === classSectionId);
    if (!student || !chosen) return;
    setSaving(true);
    const answer = await send("/api/enrollments", { studentId: student.studentId, classSectionId }, key);
    setSaving(false);
    if (!answer.ok) return setProblem(answer.message);
    onEnrolled({ academicYearId: chosen.year.academicYearId, academicYearName: chosen.year.name, classSectionId, grade: chosen.grade, section: chosen.section });
  }

  return (
    <Modal opened={!!student} onClose={onClose} title={title} centered radius="md">
      {years === undefined ? (
        <Text className="state-text">Loading sections.</Text>
      ) : sections.length === 0 ? (
        <>
          <Text className="state-text">No class sections yet. Open a school year and add its sections first.</Text>
          <Button component={Link} to="/classes" mt="md" onClick={onClose}>
            Go to classes
          </Button>
        </>
      ) : (
        <form onSubmit={submit}>
          <NativeSelect
            name="section"
            label="Section"
            ref={select}
            classNames={{ input: "field-input" }}
            data={(years ?? [])
              .filter((y) => y.sections.length)
              .map((y) => ({
                group: y.name,
                items: y.sections.map((s) => ({ value: s.classSectionId, label: `${gradeLabel(s.grade)} ${s.section} (${s.students} ${s.students === 1 ? "student" : "students"})` })),
              }))}
          />
          {problem && (
            <Text className="error" role="alert" mt="sm">
              {problem}
            </Text>
          )}
          <Group gap="sm" mt="lg">
            <Button type="submit" loading={saving}>
              Enroll
            </Button>
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
          </Group>
        </form>
      )}
    </Modal>
  );
}
