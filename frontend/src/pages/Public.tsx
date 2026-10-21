import { useEffect, useRef, useState } from "react";
import { type FileDumpSchema, type CategoryDumpSchema } from "../types";
import { API_URL } from "../environment";
import { client } from "../api/client";
import { format } from "date-fns";
import { useDisclosure } from "@mantine/hooks";
import { Notifications, notifications } from '@mantine/notifications';
import "@mantine/core/styles.css";
import '@mantine/notifications/styles.css';
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  Stack,
  Button,
  TextInput,
  defaultVariantColorsResolver,
  MantineProvider,
  parseThemeColor,
  rgba,
  darken,
  Modal,
  Select,
} from "@mantine/core";
import { IconSearch, IconEdit, IconTrash } from "@tabler/icons-react";
import "./Public.css";
import "./main.css"
import { useDebouncedValue } from "@mantine/hooks";
import { AddUpdateItem, MultiSelectWithObjects, type AddUpdateItemFormValues
 } from "./AddItem";
import {
  SatisImageEmbedModal,
  SatisImageEmbedModalButton,
} from "../components/Files";
import { useSearchParams } from "react-router";

export function Inventory({admin} : {admin: boolean} ) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300)[0];
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState< CategoryDumpSchema[] | null>(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState< CategoryDumpSchema[] | null>(null);
  const { data: assets } = client.useQuery("post", "/inventory/asset/list", {
    body: {
      search: debouncedSearch,
      permanent_location_id: selectedLocation ? parseInt(selectedLocation) : null,
      categories: selectedCategories ? selectedCategories.map((category) => category.id)  : null,
      sub_categories: selectedSubCategories ? selectedSubCategories.map((category) => category.id)  : null
    },
  });

  function DeleteItem({ id }: { id: number }) {
    const [opened, { open, close }] = useDisclosure(false);
    const queryClient = useQueryClient();

    const { mutateAsync: handleDelete } = client.useMutation(
      "delete",
      "/inventory/asset/delete/{id}",
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["post", "/inventory/asset/list"],
            exact: false,
          });
          close();
        },
      },
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
          transitionProps={{ transition: "fade", duration: 200 }}
        >
          <Stack>
            <Button
              color="rgba(245, 39, 39, 1)"
              onClick={async () => {
                try {
                  await handleDelete({ params: { path: { id } } });
                } catch (error) {
                  console.error("Failed to delete item:", error);
                }
              }}
            >
              Delete Item?
            </Button>
            <p style={{ fontSize: "12px" }}>This cannot be undone!</p>
          </Stack>
        </Modal>

        <Button
          variant="default"
          radius="lg"
          color="rgba(0, 0, 0, 1)"
          size="compact-xs"
          p={3}
          leftSection={<IconTrash size={16} />}
          styles={{ section: { marginRight: "3px" } }}
          onClick={open}
        >
          Delete
        </Button>
      </>
    );
  }

  function UpdateItem({ id }: { id: number }) {
    const asset = client.useSuspenseQuery("get", "/inventory/asset/get/{id}", {
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
      files: asset.file ? [asset.file] : [],
    };

    const [opened, { open, close }] = useDisclosure(false);
    const queryClient = useQueryClient();

    const { mutateAsync: handleUpdate } = client.useMutation(
      "post",
      "/inventory/asset/edit",
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["post", "/inventory/asset/list"],
            exact: false,
          });
          close();
        },
      },
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
          transitionProps={{ transition: "fade", duration: 200 }}
        >
          <AddUpdateItem
            onSubmit={async (values) => {
              try {
                await handleUpdate({
                  body: {
                    id: id,
                    name: values.name,
                    name_verbose: values.name_verbose,
                    quantity: values.quantity,
                    current_location: values.current_location,
                    categories: values.categories
                      .filter((cat) => cat !== null)
                      .map((category) => category.id),
                    sub_categories: values.sub_categories
                      .filter((cat) => cat !== null)
                      .map((category) => category.id),
                    notes: values.notes,
                    permanent_location_id:
                      values.permanent_location?.id ?? null,
                    last_updated: new Date().toISOString(),
                    last_updated_by: session.user?.id,
                    file_id:
                      values.files.length > 0 ? values.files[0].id : null,
                  },
                });
              } catch (error) {
                console.error("Failed to update item:", error);
                throw error;
              }
            }}
            initialValues={initialValues}
            id={id}
          />
        </Modal>

        <Button
          variant="default"
          radius="lg"
          color="rgba(0, 0, 0, 1)"
          size="compact-xs"
          p={3}
          leftSection={<IconEdit size={16} />}
          styles={{ section: { marginRight: "3px" } }}
          onClick={open}
        >
          Edit
        </Button>
      </>
    );
  }
  const [fileModalFile, setFileModalFile] = useState<FileDumpSchema | null>(
    null,
  );
  // We cannot control the modal open state based on `fileModalFile`
  // Because the modal has a fade-out animation. If you set the file to null
  // the file embed disappears while the modal is fading out and looks jank.
  // So we never set the file to null. We set it each time before opening the modal
  const [fileModalOpened, setFileModalOpened] = useState<boolean>(false);

  const rows = (assets?.elements ?? []).map((asset) =>
    admin ? (
      <Table.Tr key={asset.id}>
        <Table.Td style={{ textAlign: "left" }}>
          <Stack gap="2px">
            <UpdateItem id={asset.id}></UpdateItem>
            <DeleteItem id={asset.id}></DeleteItem>
          </Stack>
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>{asset.name}</Table.Td>
        <Table.Td style={{ textAlign: "left" }}>{asset.name_verbose}</Table.Td>
        <Table.Td style={{ textAlign: "left" }}>{asset.quantity}</Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.categories?.map((category) => category.name)?.join(", ")}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.sub_categories?.map((category) => category.name).join(", ")}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.current_location}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.permanent_location?.name}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {format(asset.last_updated, "MMMM do yyyy")}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.last_updated_by_email}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>{asset.notes}</Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.file && (
            <SatisImageEmbedModalButton
              onClick={() => {
                if (asset.file) setFileModalFile(asset.file);
                setFileModalOpened(true);
              }}
            />
          )}
        </Table.Td>
      </Table.Tr>
    ) : (
      <Table.Tr key={asset.id}>
        <Table.Td style={{ textAlign: "left" }}>{asset.name}</Table.Td>
        <Table.Td style={{ textAlign: "left" }}>{asset.name_verbose}</Table.Td>
        <Table.Td style={{ textAlign: "left" }}>{asset.quantity}</Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.categories?.map((category) => category.name)?.join(", ")}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.sub_categories?.map((category) => category.name).join(", ")}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.current_location}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.permanent_location?.name}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {format(asset.last_updated, "MMMM do yyyy")}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.last_updated_by_email}
        </Table.Td>
        <Table.Td style={{ textAlign: "left" }}>{asset.notes}</Table.Td>
        <Table.Td style={{ textAlign: "left" }}>
          {asset.file && (
            <SatisImageEmbedModalButton
              onClick={() => {
                if (asset.file) setFileModalFile(asset.file);
                setFileModalOpened(true);
              }}
            />
          )}
        </Table.Td>
      </Table.Tr>
    ),
  );

  function LocationFilter(){
      const { data: perm_locations } = client.useQuery(
        "post",
        "/inventory/locations/list",
      );

    return (
          <Select
            size="sm"
            placeholder="Filter Location"
            value={selectedLocation}
            data={(perm_locations?.locations ?? []).map((loc) => ({
              value: loc.id.toString(),
              label: loc.name,
            }))}
            onChange={(event) => setSelectedLocation(event)}
            searchable
            clearable
          />
      );
  }


  function CategoryFilter(){
    const { data: categories } = client.useQuery(
      "post",
      "/inventory/categories/list_primary",
    );

    return (
          <MultiSelectWithObjects
                    data={categories?.categories ?? []}
                    getItemLabel={(cat) => cat.name}
                    value={selectedCategories ?? []}
                    onChange={(selected) => setSelectedCategories(selected)}
                    onFocus={() => {}}
                    onBlur={() => {}}
                    placeholder="Filter Category"
                    size="sm"
          />
      );
  }


  function SubcategoryFilter(){
    const { data: subcategories } = client.useQuery(
      "post",
      "/inventory/categories/list_secondary",
    );

    return (
          <MultiSelectWithObjects
                    data={subcategories?.categories ?? []}
                    getItemLabel={(cat) => cat.name}
                    value={selectedSubCategories ?? []}
                    onChange={(selected) => setSelectedSubCategories(selected)}
                    onFocus={() => {}}
                    onBlur={() => {}}
                    placeholder="Filter Subcategory"
                    size="sm"
          />
      );
  }  



  const headerCellStyle = { fontWeight: 700 };

  const headers = admin ? (
    <Table.Tr>
      <Table.Th style={headerCellStyle}>Interact</Table.Th>
      <Table.Th style={headerCellStyle}>Item</Table.Th>
      <Table.Th style={headerCellStyle}>Description</Table.Th>
      <Table.Th style={headerCellStyle}>Count</Table.Th>
      <Table.Th style={headerCellStyle}>Categories</Table.Th>
      <Table.Th style={headerCellStyle}>Sub-Categories</Table.Th>
      <Table.Th style={headerCellStyle}>Current Location</Table.Th>
      <Table.Th style={headerCellStyle}>Permanent Home</Table.Th>
      <Table.Th style={headerCellStyle}>Last Updated</Table.Th>
      <Table.Th style={headerCellStyle}>Updated By</Table.Th>
      <Table.Th style={headerCellStyle}>Notes</Table.Th>
      <Table.Th style={headerCellStyle}>Photo</Table.Th>
    </Table.Tr>
  ) : (
    <Table.Tr>
      <Table.Th style={headerCellStyle}>Item</Table.Th>
      <Table.Th style={headerCellStyle}>Description</Table.Th>
      <Table.Th style={headerCellStyle}>Count</Table.Th>
      <Table.Th style={headerCellStyle}>Categories</Table.Th>
      <Table.Th style={headerCellStyle}>Sub-Categories</Table.Th>
      <Table.Th style={headerCellStyle}>Current Location</Table.Th>
      <Table.Th style={headerCellStyle}>Permanent Home</Table.Th>
      <Table.Th style={headerCellStyle}>Last Updated</Table.Th>
      <Table.Th style={headerCellStyle}>Updated By</Table.Th>
      <Table.Th style={headerCellStyle}>Notes</Table.Th>
      <Table.Th style={headerCellStyle}>Photo</Table.Th>
    </Table.Tr>
  );

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%", flex: 1, minHeight: 0 }}>
      <div style={{ width: "90%", marginLeft: "5%", marginRight: "5%", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px", marginRight: "15px", overflow: "visible", flexWrap: "wrap" }}>
          <TextInput
            placeholder="Search by any field"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            onChange={(event) => setSearch(event.currentTarget.value)}
            style={{ flex: "1 1 500px", minWidth: "300px" }}
            size="sm"
          />
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", overflow: "visible" }}>
            <div style={{ width: "190px", height: "36px", display: "flex", alignItems: "center", overflow: "visible", flexShrink: 0 }}><LocationFilter /></div>
            <div style={{ width: "190px", height: "36px", display: "flex", alignItems: "center", overflow: "visible", flexShrink: 0 }}><CategoryFilter /></div>
            <div style={{ width: "190px", height: "36px", display: "flex", alignItems: "center", overflow: "visible", flexShrink: 0 }}><SubcategoryFilter /></div>
          </div>
        </div>
        <Table.ScrollContainer minWidth={500} style={{ flex: 1 }} maxHeight="calc(100vh - 400px)">
          <Table withTableBorder highlightOnHover stickyHeader style={{ background: "#fff" }}>
            <Table.Thead>{headers}</Table.Thead>
            <Table.Tbody style={{ fontSize: "13px" }}>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {fileModalFile && (
          <SatisImageEmbedModal
            file={fileModalFile}
            opened={fileModalOpened}
            onClose={() => setFileModalOpened(false)}
          />
        )}
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
  if (input.variant === "light") {
    return {
      background: rgba(parsedColor.value, 0.1),
      hover: rgba(parsedColor.value, 0.15),
      border: `1px solid ${parsedColor.value}`,
      color: darken(parsedColor.value, 0.1),
    };
  }

  return defaultResolvedColors;
};

function Admin() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/users/auth/google/login`;
  };

  return (
    <Button
      variant="default"
      color="rgba(0, 0, 0, 1)"
      onClick={handleGoogleLogin}
    >
      Sign in with Google
    </Button>
  );
}

export default function Public() {
  const [params, setParams] = useSearchParams()
  const count = useRef(0);
  useEffect(() => {if (params.get("status") === "unauthorized" && (count.current === 0)) {
    notifications.show({
          title: 'Unauthorized username',
          message: 'If you believe that you should have access, reach out to the current webmaster!',
          color: "rgba(0, 0, 0, 1)",
          withBorder: true
        })
    setParams({})
    count.current = 1
  }}, [params, count] )
  
  console.log(params)

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundImage: "url(/images/dark-tl.svg), url(/images/dark-tr.svg), url(/images/dark-bl.svg), url(/images/dark-br.svg)",
        backgroundPosition: "top left, top right, bottom left, bottom right",
        backgroundRepeat: "no-repeat",
        backgroundSize: "25em",
      }}
    >
      <MantineProvider theme={{ variantColorResolver }}>
        <Notifications/>
        
        <header id="header">
          <h1 id="logo"><a href="/">Scotch'n'Soda Theatre</a></h1>
            <nav id="nav">
              <ul>
                  <li><a href="https://www.snstheatre.org/index.html">Home</a></li>
                  <li><a href="https://www.snstheatre.org/about.html">About</a></li>
                  <li><a href="https://www.snstheatre.org/getinvolved.html">Get Involved</a></li>
                  <li><a href="https://www.snstheatre.org/season.html">Season</a></li>
                  <li><a href="https://www.snstheatre.org/all_galleries.html">Photos</a></li>
                  <li className="current"><a href="https://inventory.snstheatre.org/">Shop Inventory</a></li>
                  <li><a href="https://www.snstheatre.org/give.html">Give</a></li>
                  <li><a href="https://www.snstheatre.org/contact.html">Contact</a></li>
              </ul>
            </nav>
        </header>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
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

              <div>
                <h2 style={{ color: "black", fontSize: "32px" }}>
                  {" "}
                  Shop Inventory
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
                  If you are a TAH looking to add or remove an item, please log
                  in as admin.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                marginTop: "0px",
                marginBottom: "40px",
                gap: "30px",
              }}
            >
            <Inventory admin={false} />
            </div>
            <p>Looking to borrow an item? Reach out <a href="mailto:snstheatre.tc@gmail.com?subject=SNS%20Inventory%20Item%20Request">here</a>!</p>
            <p>To report bugs, reach out to the current webmaster.</p>

          </Stack>
          <footer id="footer">
          <ul className="icons">
            <li>
              <a
                href="https://www.facebook.com/snstheatre/"
                className="icon circle fab fa-facebook-f"
                target="_blank"
                ><span className="label">Facebook</span></a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/scotchnsodatheatre"
                className="icon circle fab fa-instagram"
                target="_blank"
                ><span className="label">Instagram</span></a>
            </li>
            <li>
              <a
                href="https://www.twitter.com/snstheatre"
                className="icon circle fab fa-twitter"
                target="_blank"><span className="label">Twitter</span></a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/channel/UCYRoT4XEPocbe-3GNEutgIA"
                className="icon circle fab fa-youtube"
                target="_blank"><span className="label">YouTube</span></a
              >
            </li>
          </ul>

          <ul className="copyright">
            <li>&copy; Scotch'n'Soda Theatre</li>
            <li>Pittsburgh, PA</li>
            <li>
              Design: <a href="http://html5up.net" target="_blank">HTML5 UP</a>
            </li>
          </ul>
        </footer>
        </div>
      </MantineProvider>
    </div>
  );
}

export const PublicTable = () => <Public></Public>;
