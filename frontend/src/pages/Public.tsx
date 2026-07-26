import { Fragment, useState } from "react";
import { client } from "../api/client";
import "@mantine/core/styles.css";
import {
  Table,
  Stack,
  Button,
  Anchor,
  Container,
  Group,
  TextInput,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import classes from "./FooterSimple.module.css";
import "./Public.css";
import sns_logo from "../assets/sns_logo.png";

import { useDebouncedValue } from "@mantine/hooks";

function InventoryPublic() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300)[0];
  const { data: assets } = client.useQuery("post", "/inventory/asset/list", {
    body: { search: debouncedSearch },
  });

  const rows = (assets?.elements ?? []).map((asset) => (
    <Table.Tr key={asset.id}>
      <Table.Td>{asset.name}</Table.Td>
      <Table.Td>{asset.name_verbose}</Table.Td>
      <Table.Td>{asset.quantity}</Table.Td>
      <Table.Td>{asset.categories}</Table.Td>
      <Table.Td>{asset.sub_categories}</Table.Td>
      <Table.Td>{asset.current_location}</Table.Td>
      <Table.Td>{asset.permanent_location_id}</Table.Td>
      <Table.Td>{asset.last_updated}</Table.Td>
      <Table.Td>{asset.last_updated_by}</Table.Td>
      <Table.Td>{asset.notes}</Table.Td>
    </Table.Tr>
  ));

  return (
    <div style={{ display: "inline-block", maxWidth: "100%" }}>
      <Table.ScrollContainer minWidth={500} maxHeight={300}>
        <TextInput
          placeholder="Search by any field"
          mb="md"
          leftSection={<IconSearch size={16} stroke={1.5} />}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Table
          withTableBorder
          highlightOnHover
          stickyHeader
          stickyHeaderOffset={60}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Count</Table.Th>
              <Table.Th>Categories</Table.Th>
              <Table.Th>Sub-Categories</Table.Th>
              <Table.Th>Current Location</Table.Th>
              <Table.Th>Permanent Home</Table.Th>
              <Table.Th>Last Updated</Table.Th>
              <Table.Th>Last Updated By</Table.Th>
              <Table.Th>Notes</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody style={{ fontSize: "13px" }}>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </div>
  );
}

const links = [
  { link: "#", label: "Request Item" },
  { link: "#", label: "Scotch'n'Soda Home" },
];

export function FooterSimple() {
  const items = links.map((link) => (
    <Anchor<"a">
      c="dimmed"
      key={link.label}
      href={link.link}
      onClick={(event) => event.preventDefault()}
      size="sm"
    >
      {link.label}
    </Anchor>
  ));

  return (
    <footer className={classes.footer}>
      <Container className={classes.inner}>
        <p style={{ fontSize: "12px" }}>
          {" "}
          To report bugs reach out to Will & Madison
        </p>
        <Group className={classes.links}>{items}</Group>
      </Container>
    </footer>
  );
}

function Admin() {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/users/auth/google/login";
  };

  return <Button onClick={handleGoogleLogin}>Sign in with Google</Button>;
}

export default function Public() {
  return (
    <Fragment>
      <Stack style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "90%",
            marginRight: "auto",
            marginLeft: "auto",
            marginTop: "30px",
            gap: "50px",
          }}
        >
          <img src={sns_logo} alt="logo" width="150"></img>

          <div>
            <h2 style={{ color: "black", fontSize: "32px" }}>
              {" "}
              Scotch'n'Soda Shop Inventory
            </h2>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <Admin></Admin>
            <p
              style={{
                fontSize: "12px",
                maxWidth: "300px",
                marginTop: "10px",
                minWidth: 0,
              }}
            >
              If you are a TAH looking to add or remove an item, please log in
              as admin.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "95%",
            marginRight: "auto",
            marginLeft: "auto",
            marginTop: "70px",
            gap: "30px",
          }}
        >
          <InventoryPublic></InventoryPublic>
        </div>
      </Stack>
      <FooterSimple></FooterSimple>
    </Fragment>
  );
}

export const PublicTable = () => <Public></Public>;
