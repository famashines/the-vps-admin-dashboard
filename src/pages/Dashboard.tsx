import { Button, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

export function Dashboard() {
  return (
    <Stack gap="md" align="flex-start">
      <Title order={2}>Dashboard</Title>
      <Text className="lead">
        Admissions, fees and reports will show here as each part is set up. Start with the student list.
      </Text>
      <Button component={Link} to="/students" variant="light">
        Open students
      </Button>
    </Stack>
  );
}
