import { Button, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

export function NotFound() {
  return (
    <Stack gap="md" align="flex-start">
      <Title order={2}>Page not found</Title>
      <Text className="lead">This address does not match a page. Check the link, or go back to the dashboard.</Text>
      <Button component={Link} to="/" variant="light">
        Go to dashboard
      </Button>
    </Stack>
  );
}
