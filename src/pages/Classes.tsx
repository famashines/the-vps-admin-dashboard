import { Button, NativeSelect, Text, TextInput, Title } from "@mantine/core";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Icon } from "../icons";
import { GRADES, gradeLabel, schoolYearOf, send, showDate, yearStarting, type Year } from "../school.ts";
import { signInUrl } from "../session";

type State = { status: "loading" } | { status: "failed" } | { status: "loaded"; years: Year[] };

const fieldNames: Record<string, string> = { name: "Name", startsOn: "Starts on", endsOn: "Ends on", section: "Section" };

function useKey() {
  const [key, setKey] = useState(() => crypto.randomUUID());
  return [key, () => setKey(crypto.randomUUID())] as const;
}

function OpenYear({ suggested, onOpened }: { suggested: { name: string; startsOn: string; endsOn: string }; onOpened: () => void }) {
  const [key, nextKey] = useKey();
  const [problem, setProblem] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = { name: String(data.get("name")).trim(), startsOn: String(data.get("startsOn")), endsOn: String(data.get("endsOn")) };
    setSaving(true);
    const answer = await send("/api/academic-years", body, key);
    setSaving(false);
    if (answer.ok) {
      nextKey();
      setProblem(undefined);
      setFields({});
      onOpened();
      return;
    }
    setFields(answer.fields);
    setProblem(Object.keys(answer.fields).length ? "Check the marked fields." : answer.message);
  }

  const error = (name: string) => (fields[name] ? `${fieldNames[name]} ${name === "name" ? "must look like 2026-27" : fields[name]}.` : undefined);

  return (
    <form className="panel year-form" onSubmit={submit} key={suggested.name}>
      <Title order={2} className="panel-title">
        Open a school year
      </Title>
      <Text className="panel-text">A school year runs from 1 April to 31 March. Change the dates if your school uses others.</Text>
      {problem && (
        <Text className="error" role="alert" mt="sm">
          {problem}
        </Text>
      )}
      <div className="year-fields">
        <TextInput name="name" label="Name" defaultValue={suggested.name} error={error("name")} classNames={{ input: "field-input" }} required withAsterisk={false} />
        <TextInput name="startsOn" label="Starts on" type="date" defaultValue={suggested.startsOn} error={error("startsOn")} classNames={{ input: "field-input" }} required withAsterisk={false} />
        <TextInput name="endsOn" label="Ends on" type="date" defaultValue={suggested.endsOn} error={error("endsOn")} classNames={{ input: "field-input" }} required withAsterisk={false} />
        <Button type="submit" loading={saving} className="year-submit">
          Open {suggested.name}
        </Button>
      </div>
    </form>
  );
}

function AddSection({ year, onResult }: { year: Year; onResult: (added: string | undefined) => void }) {
  const [key, nextKey] = useKey();
  const [problem, setProblem] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = { academicYearId: year.academicYearId, grade: String(data.get("grade")), section: String(data.get("section")).trim() };
    setSaving(true);
    onResult(undefined);
    const answer = await send("/api/class-sections", body, key);
    setSaving(false);
    if (answer.ok) {
      nextKey();
      setProblem(undefined);
      const input = form.elements.namedItem("section") as HTMLInputElement;
      input.value = "";
      input.focus();
      onResult(`${gradeLabel(body.grade)} ${body.section}`);
      return;
    }
    setProblem(answer.fields.section ? "Enter a section name of 1 to 20 characters." : answer.message);
  }

  return (
    <form className="add-section" onSubmit={submit} aria-label={`Add a section to ${year.name}`}>
      <NativeSelect name="grade" label="Grade" data={GRADES.map(([value, label]) => ({ value, label }))} classNames={{ input: "field-input" }} />
      <TextInput name="section" label="Section" placeholder="A" maxLength={20} classNames={{ input: "field-input" }} required withAsterisk={false} error={problem} />
      <Button type="submit" variant="light" loading={saving} leftSection={<Icon name="add" size={16} />}>
        Add section
      </Button>
    </form>
  );
}

function YearPanel({ year, onChanged }: { year: Year; onChanged: () => void }) {
  const [added, setAdded] = useState<string>();
  const grades = GRADES.filter(([grade]) => year.sections.some((s) => s.grade === grade));
  const students = year.sections.reduce((sum, s) => sum + s.students, 0);

  return (
    <section className="panel year" aria-labelledby={`year-${year.academicYearId}`}>
      <header className="year-head">
        <div>
          <Title order={2} className="panel-title" id={`year-${year.academicYearId}`}>
            {year.name}
          </Title>
          <Text className="panel-text">
            {showDate(year.startsOn)} to {showDate(year.endsOn)}
          </Text>
        </div>
        <Text className="year-count">
          {year.sections.length} {year.sections.length === 1 ? "section" : "sections"}, {students} {students === 1 ? "student" : "students"}
        </Text>
      </header>
      {grades.length === 0 ? (
        <Text className="state-text board-empty">No sections yet. Add the first one below, for example Class 1, section A.</Text>
      ) : (
        <dl className="board">
          {grades.map(([grade, label]) => (
            <div className="board-row" key={grade}>
              <dt>{label}</dt>
              <dd>
                {year.sections
                  .filter((s) => s.grade === grade)
                  .map((s) => (
                    <span className="tag" key={s.classSectionId}>
                      <span className="tag-name">{s.section}</span>
                      <span className="tag-count" aria-label={`${s.students} students`}>
                        {s.students}
                      </span>
                    </span>
                  ))}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {added && (
        <div className="notice" role="status">
          <Icon name="check" />
          <Text>Added {added}.</Text>
        </div>
      )}
      <AddSection
        year={year}
        onResult={(label) => {
          setAdded(label);
          if (label) onChanged();
        }}
      />
    </section>
  );
}

export function Classes() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(() => {
    fetch("/api/academic-years")
      .then(async (response) => {
        if (response.status === 401) return location.assign(signInUrl());
        setState(response.ok ? { status: "loaded", years: await response.json() } : { status: "failed" });
      })
      .catch(() => setState({ status: "failed" }));
  }, []);

  useEffect(load, [load]);

  const years = state.status === "loaded" ? state.years : [];
  const suggested = years.length ? yearStarting(Number(years[0].endsOn.slice(0, 4))) : schoolYearOf(new Date());

  return (
    <>
      <header className="page-head">
        <div>
          <Title order={1}>Classes</Title>
          <Text className="lead">School years and their class sections. Students are enrolled into a section on the Students page.</Text>
        </div>
      </header>
      {state.status === "loading" && <Text className="state-text">Loading school years.</Text>}
      {state.status === "failed" && (
        <div className="panel state">
          <Text className="state-title error" role="alert">
            The school years did not load.
          </Text>
          <Text className="state-text">Check the connection, then reload the page.</Text>
          <Button variant="default" mt="md" onClick={() => location.reload()}>
            Reload page
          </Button>
        </div>
      )}
      {state.status === "loaded" && (
        <div className="years">
          {years.length === 0 && (
            <div className="panel state">
              <Text className="state-title">No school year yet.</Text>
              <Text className="state-text">Open the first school year below. Then add its class sections.</Text>
            </div>
          )}
          {years.map((year) => (
            <YearPanel key={year.academicYearId} year={year} onChanged={load} />
          ))}
          <OpenYear suggested={suggested} onOpened={load} />
        </div>
      )}
    </>
  );
}
