import { AppShell, Burger, Button, Group, NavLink, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { NavLink as RouterLink, Route, Routes } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { NotFound } from "./pages/NotFound";
import { NoAccess, SignIn } from "./pages/SignIn";
import { Students } from "./pages/Students";
import { signOut, useSession, type User } from "./session";

const release = (import.meta.env.VITE_RELEASE ?? "local").slice(0, 7);

const pages = [
  { to: "/", label: "Dashboard" },
  { to: "/students", label: "Students" },
];

export function App() {
  const session = useSession();
  if (session.status === "loading") return null;
  if (session.status === "signed-out") return <SignIn />;
  if (!session.user.roles.includes("admin")) return <NoAccess name={session.user.name} />;
  return <Shell user={session.user} />;
}

function Shell({ user }: { user: User }) {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 232, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="xl"
      withBorder={false}
    >
      <AppShell.Header className="header">
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="sm" align="baseline">
            <Title order={1} fz="1.25rem" lh={1}>
              the-vps
            </Title>
            <Text c="dimmed" size="sm">
              School office
            </Text>
          </Group>
          <Group gap="md">
            <Text c="dimmed" size="sm" visibleFrom="sm">
              {user.name}
            </Text>
            <Button variant="subtle" size="compact-sm" onClick={signOut}>
              Sign out
            </Button>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label={opened ? "Close the menu" : "Open the menu"} />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="navbar" p="md" aria-label="Main menu">
        <Stack justify="space-between" h="100%">
          <Stack gap={4}>
            {pages.map((page) => (
              <NavLink
                key={page.to}
                component={RouterLink}
                to={page.to}
                end
                label={page.label}
                className="nav-link"
                onClick={close}
              />
            ))}
          </Stack>
          <Text className="release">Release {release}</Text>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <div className="page">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
