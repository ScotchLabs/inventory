import { Fragment, useState } from "react";
import { client } from "../api/client";
import { format } from 'date-fns';
import { useDisclosure } from '@mantine/hooks';
import "@mantine/core/styles.css";
import { useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Stack,
  Button,
  Anchor,
  Container,
  Group,
  TextInput,
  defaultVariantColorsResolver,
  MantineProvider,
  parseThemeColor,
  rgba,
  darken,
  Modal
} from "@mantine/core";
import { IconSearch, IconEdit, IconTrash } from "@tabler/icons-react";
import classes from "./FooterSimple.module.css";
import "./Public.css";
import sns_logo from "../assets/sns_logo.png";
import { useDebouncedValue } from "@mantine/hooks";
import { AddUpdateItem, type AddUpdateItemFormValues } from "./AddItem"

export function Inventory(admin:boolean) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300)[0];
  const { data: assets } = client.useQuery("post", "/inventory/asset/list", {
    body: { search: debouncedSearch }
  });

  function DeleteItem({ id }: { id: number }) {
    const [opened, { open, close }] = useDisclosure(false);
    const queryClient = useQueryClient();

    const { mutateAsync: handleDelete} = client.useMutation(
        'delete',
        '/inventory/asset/delete/{id}',
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["post", "/inventory/asset/list"],
              exact: false
            });
            close()
          }
        }
    );

    return (
      <>
        <Modal
          centered={true}
          size="auto"
          opened={opened}
          onClose={close}
          withCloseButton={false}
          radius={0}
          transitionProps={{ transition: 'fade', duration: 200 }}
        >
          <Stack>
            <Button color="rgba(245, 39, 39, 1)"
                  onClick={async () => {
                    try {
                      await handleDelete({ params: { path: { id } } });
                    } catch (error) {
                      console.error('Failed to delete item:', error);
                    }
                  }}>Delete Item?</Button>
            <p style={{ fontSize: "12px" }}>This cannot be undone!</p>
          </Stack>
        </Modal>

        <Button variant="default"
                radius="lg"
                color="rgba(0, 0, 0, 1)"
                size="compact-xs"
                p={3}
                leftSection={<IconTrash size={16}/>}
                styles={{section:{ marginRight: '3px' }}} onClick={open}>
          Delete
        </Button>
      </>
    );
  }

  function UpdateItem({id}: {id: number}) {
    const asset = client.useSuspenseQuery(
          'get',
          '/inventory/asset/get/{id}', {
          params: {
            path: { id: id },
          },
        }).data;

    const initialValues: AddUpdateItemFormValues = {
            name: asset.name,
            name_verbose: asset.name_verbose,
            quantity: asset.quantity,
            current_location: asset.current_location,
            permanent_location: asset.permanent_location ?? null,
            categories: asset.categories ?? [],
            sub_categories: asset.sub_categories ?? [],
            notes: asset.notes,
            file_id: asset.file_id ?? null,
          }

    const [opened, { open, close }] = useDisclosure(false);
    const queryClient = useQueryClient();

    const { mutateAsync: handleUpdate } = client.useMutation(
        'post',
        '/inventory/asset/edit',
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["post", "/inventory/asset/list"],
              exact: false
            });
            close()
          }
        }
    );

  const { data: session } = client.useSuspenseQuery(
          "get",
          "/users/users/current-session",
        );

  return (
      <>
        <Modal
          centered={true}
          size="auto"
          opened={opened}
          onClose={close}
          withCloseButton={false}
          radius={0}
          transitionProps={{ transition: 'fade', duration: 200 }}
        >
          <AddUpdateItem onSubmit={async (values) => {
              try {
                await handleUpdate({
                  body: {
                    id: id,
                    name: values.name,
                    name_verbose: values.name_verbose,
                    quantity: values.quantity,
                    current_location: values.current_location,
                    categories: values.categories.filter((cat) => cat !== null).map((category) => category.id),
                    sub_categories: values.sub_categories.filter((cat) => cat !== null).map((category) => category.id),
                    notes: values.notes,
                    file_id: values.file_id,
                    permanent_location_id: values.permanent_location?.id ?? null,
                    last_updated: new Date().toISOString(),
                    last_updated_by: session.user?.id,
                  }
                })
              } catch (error) {
                console.error('Failed to update item:', error);
                throw error;
              }
          }} 
          initialValues={initialValues}
          id={id}/>
        </Modal>

        <Button variant="default"
                radius="lg"
                color="rgba(0, 0, 0, 1)"
                size="compact-xs"
                p={3}
                leftSection={<IconEdit size={16}/>}
                styles={{section:{ marginRight: '3px' }}}
                onClick={open}>
          Edit</Button>
      </>
    );


  }

  const rows = (assets?.elements ?? []).map((asset) =>
    admin?
    (
      <Table.Tr key={asset.id}>
        <Table.Td>
          <Stack gap="2px">
            <UpdateItem id={asset.id}></UpdateItem>
            <DeleteItem id={asset.id}></DeleteItem>
          </Stack>
        </Table.Td>
        <Table.Td>{asset.name}</Table.Td>
        <Table.Td>{asset.name_verbose}</Table.Td>
        <Table.Td>{asset.quantity}</Table.Td>
        <Table.Td>{asset.categories?.map((category) => category.name)?.join(", ")}</Table.Td>
        <Table.Td>{asset.sub_categories?.map((category) => category.name).join(", ")}</Table.Td>
        <Table.Td>{asset.current_location}</Table.Td>
        <Table.Td>{asset.permanent_location?.name}</Table.Td>
        <Table.Td>{format(asset.last_updated, "MMMM do yyyy")}</Table.Td>
        <Table.Td>{asset.last_updated_by_email}</Table.Td>
        <Table.Td>{asset.notes}</Table.Td>
      </Table.Tr>
    )
    :
    (
    <Table.Tr key={asset.id}>
      <Table.Td>{asset.name}</Table.Td>
      <Table.Td>{asset.name_verbose}</Table.Td>
      <Table.Td>{asset.quantity}</Table.Td>
      <Table.Td>{asset.categories?.map((category) => category.name)?.join(", ")}</Table.Td>
      <Table.Td>{asset.sub_categories?.map((category) => category.name).join(", ")}</Table.Td>
      <Table.Td>{asset.current_location}</Table.Td>
      <Table.Td>{asset.permanent_location?.id}</Table.Td>
      <Table.Td>{format(asset.last_updated, "MMMM do yyyy")}</Table.Td>
      <Table.Td>{asset.last_updated_by_email}</Table.Td>
      <Table.Td>{asset.notes}</Table.Td>
    </Table.Tr>
  ));

  const headers =
    admin?
    <Table.Tr>
      <Table.Th>Interact</Table.Th>
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
    :
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

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <div style={{ width: "100%", maxWidth: "1200px", paddingLeft: "20px", paddingRight: "20px" }}>
        <TextInput
            placeholder="Search by any field"
            mb="md"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
        <Table.ScrollContainer minWidth={500} maxHeight={300}>
          <Table
            withTableBorder
            highlightOnHover
            stickyHeader
          >
            <Table.Thead>
              {headers}
            </Table.Thead>
            <Table.Tbody style={{ fontSize: "13px" }}>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </div>
    </div>
  );
}

export const variantColorResolver = (input: any) => {
  const defaultResolvedColors = defaultVariantColorsResolver(input);
  const parsedColor = parseThemeColor({
    color: input.color || input.theme.primaryColor,
    theme: input.theme,
  });

  // Completely override variant
  if (input.variant === 'light') {
    return {
      background: rgba(parsedColor.value, 0.1),
      hover: rgba(parsedColor.value, 0.15),
      border: `1px solid ${parsedColor.value}`,
      color: darken(parsedColor.value, 0.1),
    };
  }

  return defaultResolvedColors;
};

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

  return <Button variant="default" color = "rgba(0, 0, 0, 1)" onClick={handleGoogleLogin}>Sign in with Google</Button>;
}

export default function Public() {
  const Table = Inventory(false)

  return (
    <MantineProvider theme={{ variantColorResolver }}>
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
          {Table}
          </div>
        </Stack>
        <FooterSimple></FooterSimple>
      </Fragment>
    </MantineProvider>
  );
}

export const PublicTable = () => <Public></Public>;
