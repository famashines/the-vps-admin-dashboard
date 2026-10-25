import { AppShell, Avatar, Burger, Group, NavLink, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { NavLink as RouterLink, Route, Routes } from "react-router";
import { Icon } from "./icons";
import { Dashboard } from "./pages/Dashboard";
import { NotFound } from "./pages/NotFound";
import { RegisterStudent } from "./pages/RegisterStudent";
import { NoAccess, SignIn } from "./pages/SignIn";
import { Students } from "./pages/Students";
import { signOut, useSession, type User } from "./session";

const release = (import.meta.env.VITE_RELEASE ?? "local").slice(0, 7);

const pages = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/students", label: "Students", icon: "students" },
] as const;

export function App() {
  const session = useSession();
  if (session.status === "loading") return null;
  if (session.status === "signed-out") return <SignIn />;
  if (!session.user.roles.includes("admin")) return <NoAccess name={session.user.name} />;
  return <Shell user={session.user} />;
}

function Brand() {
  return (
    <div className="brand">
      <Text className="brand-name">the-vps</Text>
      <Text className="brand-role">School office</Text>
    </div>
  );
}

function Shell({ user }: { user: User }) {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: { base: 56, sm: 0 } }}
      navbar={{ width: 248, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding={0}
      withBorder={false}
    >
      <AppShell.Header className="header">
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Brand />
          <Burger opened={opened} onClick={toggle} size="sm" aria-label={opened ? "Close the menu" : "Open the menu"} />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="navbar" aria-label="Main menu">
        <AppShell.Section className="navbar-top" visibleFrom="sm">
          <Brand />
        </AppShell.Section>
        <AppShell.Section grow className="navbar-links">
          {pages.map((page) => (
            <NavLink
              key={page.to}
              component={RouterLink}
              to={page.to}
              end={page.to === "/"}
              label={page.label}
              leftSection={<Icon name={page.icon} />}
              className="nav-link"
              onClick={close}
            />
          ))}
        </AppShell.Section>
        <AppShell.Section className="navbar-user">
          <Group gap="sm" wrap="nowrap">
            <Avatar name={user.name} color="ink" size={34} radius="xl" />
            <Text className="user-name" truncate>
              {user.name}
            </Text>
          </Group>
          <UnstyledButton className="sign-out" onClick={signOut}>
            <Icon name="signOut" size={16} />
            Sign out
          </UnstyledButton>
          <Text className="release">Release {release}</Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main className="main">
        <div className="page">
          <Routes>
            <Route path="/" element={<Dashboard name={user.name} />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/new" element={<RegisterStudent />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
