import {
  Skeleton,
  Stack,
  Group,
  Container,
  Anchor,
  Button,
  Modal,
  MantineProvider,
} from "@mantine/core";
import { API_URL } from "../environment";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, Suspense } from "react";
import { useNavigate, Outlet } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "../api/client";
import { Inventory, variantColorResolver } from "./Public";
import { AddUpdateItem } from "./AddItem";
import classes from "./FooterSimple.module.css";
import { Header } from "../components/Header";

function EnsureLogin() {
  const { data: session } = client.useSuspenseQuery(
    "get",
    "/users/users/current-session",
  );
  const navigate = useNavigate();
  useEffect(() => {
    if (!session.user) {
      navigate("/");
    }
  }, [session, navigate]);
  return <></>;
}

export function AdminProvider() {
  return (
    <Suspense fallback={<Skeleton height={8} mt={6} width="70%" radius="xl" />}>
      <EnsureLogin />
      <Outlet />
    </Suspense>
  );
}

const links = [
  { link: "mailto:snstheatre.tc@gmail.com?subject=SNS%20Inventory%20Item%20Request",
    label: "Rent Item (via email)", },
];

export function FooterSimple() {
  const items = links.map((link) => (
    <Anchor<"a"> c="dimmed" key={link.label} href={link.link} size="sm">
      {link.label}
    </Anchor>
  ));

  return (
    <footer className={classes.footer}>
      <Container className={classes.inner}>
        <p style={{ fontSize: "12px" }}>
          {" "}
          To report bugs reach out to current webmaster
        </p>
        <Group className={classes.links}>{items}</Group>
      </Container>
    </footer>
  );
}

function Logout() {
  const handleLogout = () => {
    window.location.href = `${API_URL}/users/auth/logout`;
  };
  return (
    <Button variant="filled" color="#000" size="xs" onClick={handleLogout}>
      Logout
    </Button>
  );
}

function AddItemPopup() {
  const [opened, { open, close }] = useDisclosure(false);
  const queryClient = useQueryClient();

  const { mutateAsync: createAsset } = client.useMutation(
    "post",
    "/inventory/asset/create",
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
        opened={opened}
        onClose={close}
        title="Add a new item to inventory"
        styles={{
          title: {
            color: "var(--mantine-color-black)",
            fontSize: "1.25rem",
            fontWeight: 700,
          },
        }}
        radius={0}
        transitionProps={{ transition: "fade", duration: 200 }}
      >
        <AddUpdateItem
          onSubmit={async (values) => {
            try {
              await createAsset({
                body: {
                  name: values.name,
                  name_verbose: values.name_verbose,
                  quantity: values.quantity,
                  current_location: values.current_location,
                  categories: values.categories.map((category) => category.id),
                  sub_categories: values.sub_categories.map(
                    (category) => category.id,
                  ),
                  notes: values.notes,
                  permanent_location_id: values.permanent_location?.id,
                  last_updated: new Date().toISOString(),
                  last_updated_by: session.user?.id,
                  file_id: values.files.length > 0 ? values.files[0].id : null,
                },
              });
            } catch (error) {
              console.error("Failed to create item:", error);
              throw error;
            }
          }}
          initialValues={{
            name: "",
            name_verbose: "",
            quantity: 1,
            current_location: "",
            permanent_location: null,
            categories: [],
            sub_categories: [],
            notes: "",
            files: [],
          }}
          id={null}
        />
      </Modal>

      <Button variant="filled" color="#000" size="xs" onClick={open}>
        Add New Item
      </Button>
    </>
  );
}

export function InventoryTable() {

  return (
    <MantineProvider theme={{ variantColorResolver }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Stack style={{ flex: 1, minHeight: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "90%",
              marginRight: "auto",
              marginLeft: "auto",
              marginTop: "40px",
              gap: "50px",
              paddingBottom: "17px",
            }}
          >
            <div>
              <h2 style={{ color: "#000", fontSize: "1.5em", fontWeight: "400", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0" }}>
                {" "}
                Scotch'n'Soda Shop Inventory
              </h2>
            </div>

            <div style={{ marginLeft: "auto", marginRight: "30px" }}>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                }}
              >
                <Logout></Logout>
                <AddItemPopup></AddItemPopup>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              marginTop: "20px",
              gap: "30px",
            }}
          >
          <Inventory admin={true}/>
          </div>
        </Stack>
        <FooterSimple></FooterSimple>
      </div>
    </MantineProvider>
  );
}

export function AdminPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        height: "100vh",
      }}
    >
      <Header />
      <InventoryTable></InventoryTable>
    </div>
  );
}
