import { Button, Group, Stack, Table, Text, Title, Tooltip } from "@mantine/core";

const columns = ["Admission no.", "Name", "Date of birth", "Guardian", "Phone"];

export function Students() {
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={2}>Students</Title>
        <Tooltip label="Registration opens in the next release">
          <Button data-disabled onClick={(event) => event.preventDefault()}>
            Register student
          </Button>
        </Tooltip>
      </Group>
      <Table.ScrollContainer minWidth={640}>
        <Table className="ruled" withRowBorders={false}>
          <Table.Thead>
            <Table.Tr>
              {columns.map((column) => (
                <Table.Th key={column}>{column}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Text c="dimmed" py="lg">
                  No students registered yet.
                </Text>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
