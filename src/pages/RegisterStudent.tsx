import { Button, Group, NativeSelect, Radio, Stack, Text, TextInput, Title } from "@mantine/core";
import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toE164 } from "../phone.ts";
import { signInUrl } from "../session";

type FieldErrors = Record<string, string>;

const labels: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  "guardian.name": "Guardian name",
  "guardian.relation": "Relation",
  "guardian.phone": "Phone",
};

const messageFor = (field: string, message: string) => {
  if (field === "guardian.phone") return "Enter a mobile number, for example 0300 1234567.";
  if (field === "dateOfBirth") return "Enter a real date.";
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    const body = {
      firstName: value("firstName"),
      lastName: value("lastName"),
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
        navigate("/students", { state: { registered: { studentId: answer.studentId, admissionNumber: answer.admissionNumber, name: `${body.firstName} ${body.lastName}` } } });
        return;
      }
      if (response.status === 400 && Array.isArray(answer.fields)) {
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
    <TextInput name={name} label={label} error={errors[name]} onChange={() => clear(name)} classNames={{ input: "line-input" }} required withAsterisk={false} {...extra} />
  );

  return (
    <Stack gap="lg" className="register">
      <div>
        <Title order={2}>Register student</Title>
        <Text className="lead">The admission number is given when you register.</Text>
      </div>
      {problem && (
        <Text className="error" role="alert">
          {problem}
        </Text>
      )}
      <form ref={form} onSubmit={submit}>
        <Stack gap="xl">
          <fieldset className="entry">
            <legend>Student</legend>
            <div className="pair">
              {line("firstName", "First name", { autoFocus: true, autoComplete: "off" })}
              {line("lastName", "Last name", { autoComplete: "off" })}
            </div>
            <div className="pair">
              {line("dateOfBirth", "Date of birth", { type: "date", max: new Date().toISOString().slice(0, 10) })}
              <Radio.Group name="gender" label="Gender" error={errors.gender} onChange={() => clear("gender")} required withAsterisk={false}>
                <Group gap="lg" mt={10}>
                  <Radio value="female" label="Female" />
                  <Radio value="male" label="Male" />
                </Group>
              </Radio.Group>
            </div>
          </fieldset>
          <fieldset className="entry">
            <legend>Guardian</legend>
            {line("guardian.name", "Guardian name", { autoComplete: "off" })}
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
                classNames={{ input: "line-input" }}
                required
                withAsterisk={false}
              />
              {line("guardian.phone", "Phone", { type: "tel", inputMode: "tel", placeholder: "0300 1234567", autoComplete: "off" })}
            </div>
          </fieldset>
          <Group gap="md">
            <Button type="submit" loading={saving}>
              Register student
            </Button>
            <Button component={Link} to="/students" variant="subtle">
              Cancel
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
