import { ActionIcon, AppShell, Avatar, Burger, Group, NavLink, Text, UnstyledButton } from "@mantine/core";
import { spotlight } from "@mantine/spotlight";
import { useDisclosure } from "@mantine/hooks";
import { Link, NavLink as RouterLink, Route, Routes } from "react-router";
import { Icon } from "./icons";
import { Search, SearchButton } from "./Search";
import { Classes } from "./pages/Classes";
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
  { to: "/classes", label: "Classes", icon: "classes" },
] as const;

export function App() {
  const session = useSession();
  if (session.status === "loading") return null;
  if (session.status === "signed-out") return <SignIn />;
  if (!session.user.roles.includes("admin")) return <NoAccess name={session.user.name} />;
  return <Shell user={session.user} />;
}

function Brand({ onClick }: { onClick: () => void }) {
  return (
    <Link to="/" className="brand" onClick={onClick}>
      <Text className="brand-name">VPS</Text>
      <Text className="brand-role">The Vision Public School</Text>
    </Link>
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
          <Brand onClick={close} />
          <Group gap={4} wrap="nowrap">
            <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Search" onClick={spotlight.open}>
              <Icon name="search" />
            </ActionIcon>
            <Burger opened={opened} onClick={toggle} size="sm" aria-label={opened ? "Close the menu" : "Open the menu"} />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="navbar" aria-label="Main menu">
        <AppShell.Section className="navbar-top">
          <div className="navbar-brand">
            <Brand onClick={close} />
          </div>
          <SearchButton onOpen={close} />
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
            <Route path="/classes" element={<Classes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AppShell.Main>
      <Search />
    </AppShell>
  );
}
