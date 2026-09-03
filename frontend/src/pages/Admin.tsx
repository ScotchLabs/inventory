import { Skeleton, Stack, Group, Container, Anchor, Button, Modal, MantineProvider } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { useEffect, Suspense, Fragment } from "react";
import { useNavigate, Outlet } from "react-router";
import { useQueryClient } from '@tanstack/react-query';
import { client } from "../api/client";
import { Inventory, variantColorResolver } from "./Public";
import { AddUpdateItem } from "./AddItem";
import sns_logo from "../assets/sns_logo.png";
import classes from "./FooterSimple.module.css";

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

function Logout() {
  const handleLogout = () => {
    window.location.href = "http://localhost:8000/users/auth/logout";
  };
  return <Button variant="default" color="rgba(0, 0, 0, 1)" onClick={handleLogout}>Logout</Button>;
}

function AddItemPopup() {
  const [opened, { open, close }] = useDisclosure(false);
  const queryClient = useQueryClient();

  const { mutateAsync: createAsset } = client.useMutation(
        'post',
        '/inventory/asset/create',
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["post", "/inventory/asset/list"],
              exact: false
            });
            close()
          },
        }
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
        styles={{ title: {color: 'var(--mantine-color-black)', fontSize: '1.25rem', fontWeight: 700}, }}
        radius={0}
        transitionProps={{ transition: 'fade', duration: 200 }}
      >
        <AddUpdateItem onSubmit={async (values) => {
              try {
                await createAsset({
                  body: {
                    name: values.name,
                    name_verbose: values.name_verbose,
                    quantity: values.quantity,
                    current_location: values.current_location,
                    categories: values.categories.map((category) => category.id),
                    sub_categories: values.sub_categories.map((category) => category.id),
                    notes: values.notes,
                    file_id: values.file_id,
                    permanent_location_id: values.permanent_location?.id,
                    last_updated: new Date().toISOString(),
                    last_updated_by: session.user?.id,
                  },
                })
              } catch (error) {
                console.error('Failed to create item:', error);
                throw error;
              }
            }}
          initialValues = {
            {
              name: '',
              name_verbose: '',
              quantity: 1,
              current_location: '',
              permanent_location: null,
              categories: [],
              sub_categories: [],
              notes: '',
              file_id: null,
            }
          }
          id = {null}
          />
      </Modal>

      <Button variant="default" color="rgba(0, 0, 0, 1)" onClick={open}>
        Add New Item
      </Button>
    </>
  );
}

export function InventoryTable() {
  const InventoryPrivate = Inventory(true)

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
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <Logout></Logout>
                <AddItemPopup></AddItemPopup>
              </div>
              <p
                style={{
                  fontSize: "14px",
                  maxWidth: "300px",
                  marginTop: "10px",
                  minWidth: 0,
                }}
              >
                Edit/delete existing items using the "interact" column
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
          {InventoryPrivate}
          </div>
        </Stack>
        <FooterSimple></FooterSimple>
      </Fragment>
    </MantineProvider>
  );
}

export function AdminPage() {
  return (
    <div>
      <InventoryTable></InventoryTable>
    </div>
  )
}

