import { Text, Title } from "@mantine/core";
import { Link } from "react-router";
import { Icon } from "../icons";

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

const today = () => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

const actions = [
  { to: "/students/new", icon: "add", title: "Register a student", text: "Add a new admission with the guardian's phone. The admission number is given on save." },
  { to: "/students", icon: "students", title: "Open the student list", text: "See every registered student with their admission number and guardian." },
] as const;

const coming = ["Fee structure", "Cash payments and receipts", "Fee reports and defaulters"];

export function Dashboard({ name }: { name: string }) {
  return (
    <>
      <header className="page-head">
        <div>
          <Title order={1}>
            {greeting()}, {name.split(" ")[0]}
          </Title>
          <Text className="lead">{today()}</Text>
        </div>
      </header>
      <div className="dash">
        <section className="panel" aria-labelledby="start-here">
          <Title order={2} id="start-here" className="panel-title">
            Start here
          </Title>
          <ul className="action-list">
            {actions.map((action) => (
              <li key={action.to}>
                <Link to={action.to} className="action">
                  <span className="action-icon">
                    <Icon name={action.icon} size={20} />
                  </span>
                  <span>
                    <span className="action-title">{action.title}</span>
                    <span className="action-text">{action.text}</span>
                  </span>
                  <span className="action-arrow">
                    <Icon name="arrow" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel" aria-labelledby="coming-next">
          <Title order={2} id="coming-next" className="panel-title">
            Coming next
          </Title>
          <Text className="panel-text">Each part shows on this page when it is ready.</Text>
          <ul className="coming-list">
            {coming.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
