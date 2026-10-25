import { Button, Group, NativeSelect, Radio, Text, TextInput, Title } from "@mantine/core";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toE164 } from "../phone.ts";
import { birthDateLimits, gradeLabel, send, todayInPakistan, type Year } from "../school.ts";
import { signInUrl } from "../session";

type FieldErrors = Record<string, string>;

const labels: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  fatherName: "Father name",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  "guardian.name": "Guardian name",
  "guardian.relation": "Relation",
  "guardian.phone": "Phone",
};

const messageFor = (field: string, message: string) => {
  if (field === "guardian.phone") return "Enter a mobile number, for example 0300 1234567.";
  if (field === "dateOfBirth") return message.includes("years old") ? "The student must be 2 to 25 years old." : "Enter a real date.";
  if (message === "is required") return `${labels[field] ?? field} is required.`;
  return `${labels[field] ?? field} ${message}.`;
};

export function RegisterStudent() {
  const navigate = useNavigate();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [problem, setProblem] = useState<string>();
  const [saving, setSaving] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const [enrollKey] = useState(() => crypto.randomUUID());
  const [year, setYear] = useState<Year | null>();
  const [fatherName, setFatherName] = useState("");
  const [relation, setRelation] = useState("father");
  const [guardianName, setGuardianName] = useState("");
  const [linked, setLinked] = useState(true);

  useEffect(() => {
    fetch("/api/academic-years")
      .then(async (r) => setYear(r.ok ? ((await r.json())[0] ?? null) : null))
      .catch(() => setYear(null));
  }, []);

  const shownGuardian = linked && relation === "father" ? fatherName : guardianName;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    const body = {
      firstName: value("firstName"),
      lastName: value("lastName"),
      fatherName: value("fatherName"),
      dateOfBirth: value("dateOfBirth"),
      gender: value("gender"),
      guardian: { name: value("guardian.name"), relation: value("guardian.relation"), phone: toE164(value("guardian.phone")) },
    };
    setSaving(true);
    setProblem(undefined);
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify(body),
      });
      if (response.status === 401) return location.assign(signInUrl());
      const answer = await response.json().catch(() => ({}));
      if (response.ok) {
        const registered: Record<string, string> = { studentId: answer.studentId, admissionNumber: answer.admissionNumber, name: `${body.firstName} ${body.lastName}` };
        const classSectionId = value("classSectionId");
        const chosen = year?.sections.find((s) => s.classSectionId === classSectionId);
        if (chosen) {
          const enrolled = await send("/api/enrollments", { studentId: answer.studentId, classSectionId }, enrollKey);
          if (enrolled.ok) registered.enrolledIn = `${gradeLabel(chosen.grade)} ${chosen.section}`;
          else registered.enrollProblem = enrolled.message;
        }
        navigate("/students", { state: { registered } });
        return;
      }
      if (Array.isArray(answer.fields)) {
        const next: FieldErrors = {};
        for (const f of answer.fields as { field: string; message: string }[]) next[f.field] ??= messageFor(f.field, f.message);
        setErrors(next);
        setProblem("Check the marked fields.");
        const first = Object.keys(labels).find((name) => next[name]);
        form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        return;
      }
      setProblem(answer.error ?? "The student was not saved. Try again.");
    } catch {
      setProblem("The student was not saved, because the connection failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const clear = (name: string) => errors[name] && setErrors(({ [name]: _, ...rest }) => rest);
  const line = (name: string, label: string, extra: object = {}) => (
    <TextInput name={name} label={label} error={errors[name]} onChange={() => clear(name)} classNames={{ input: "field-input" }} required withAsterisk={false} {...extra} />
  );

  return (
    <div className="register">
      <header className="page-head">
        <div>
          <Title order={1}>Register student</Title>
          <Text className="lead">The admission number is given when you register.</Text>
        </div>
      </header>
      {problem && (
        <Text className="problem" role="alert">
          {problem}
        </Text>
      )}
      <form ref={form} onSubmit={submit} className="panel form-panel">
        <fieldset className="entry">
          <legend>Student</legend>
          <Text className="entry-hint">Write the names as on the B-form or birth certificate.</Text>
          <div className="pair">
            {line("firstName", "First name", { autoFocus: true, autoComplete: "off" })}
            {line("lastName", "Last name", { autoComplete: "off" })}
          </div>
          {line("fatherName", "Father name", {
            autoComplete: "off",
            value: fatherName,
            onChange: (event: { currentTarget: HTMLInputElement }) => {
              clear("fatherName");
              setFatherName(event.currentTarget.value);
            },
          })}
          <div className="pair">
            {line("dateOfBirth", "Date of birth", { type: "date", ...birthDateLimits(todayInPakistan(new Date())) })}
            <Radio.Group name="gender" label="Gender" error={errors.gender} onChange={() => clear("gender")} required withAsterisk={false}>
              <Group gap="lg" mt={10}>
                <Radio value="female" label="Female" />
                <Radio value="male" label="Male" />
              </Group>
            </Radio.Group>
          </div>
          <NativeSelect
            name="classSectionId"
            label="Class"
            description={
              year === null || (year && year.sections.length === 0) ? (
                <>
                  No class sections yet. Add them on the <Link to="/classes">Classes</Link> page, or enroll the student later.
                </>
              ) : year ? (
                `Sections of ${year.name}. The student is enrolled right after the registration.`
              ) : undefined
            }
            data={[
              { value: "", label: "Choose later" },
              ...(year?.sections ?? []).map((s) => ({ value: s.classSectionId, label: `${gradeLabel(s.grade)} ${s.section}` })),
            ]}
            disabled={!year || year.sections.length === 0}
            classNames={{ input: "field-input" }}
          />
        </fieldset>
        <fieldset className="entry">
          <legend>Guardian</legend>
          <Text className="entry-hint">The office uses this phone number to reach the family.</Text>
          {line("guardian.name", "Guardian name", {
            autoComplete: "off",
            value: shownGuardian,
            description: linked && relation === "father" ? "Filled in from the father name. Change it if someone else is the guardian." : undefined,
            onChange: (event: { currentTarget: HTMLInputElement }) => {
              clear("guardian.name");
              setLinked(false);
              setGuardianName(event.currentTarget.value);
            },
          })}
          <div className="pair">
            <NativeSelect
              name="guardian.relation"
              label="Relation"
              data={[
                { value: "father", label: "Father" },
                { value: "mother", label: "Mother" },
                { value: "guardian", label: "Other guardian" },
              ]}
              error={errors["guardian.relation"]}
              value={relation}
              onChange={(event) => {
                const next = event.currentTarget.value;
                if (next === "father" && !guardianName.trim()) setLinked(true);
                if (next !== "father" && linked) {
                  setGuardianName(fatherName);
                  setLinked(false);
                }
                setRelation(next);
              }}
              classNames={{ input: "field-input" }}
              required
              withAsterisk={false}
            />
            {line("guardian.phone", "Phone", { type: "tel", inputMode: "tel", placeholder: "0300 1234567", autoComplete: "off" })}
          </div>
        </fieldset>
        <Group gap="sm" className="form-actions">
          <Button type="submit" loading={saving}>
            Register student
          </Button>
          <Button component={Link} to="/students" variant="default">
            Cancel
          </Button>
        </Group>
      </form>
    </div>
  );
}
