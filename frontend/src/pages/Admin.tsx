import {
  Skeleton,
  Stack,
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

function Logout() {
  const handleLogout = () => {
    window.location.href = `${API_URL}/users/auth/logout`;
  };
  return (
    <Button variant="default" color="rgba(0, 0, 0, 1)" onClick={handleLogout}>
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

      <Button variant="default" color="rgba(0, 0, 0, 1)" onClick={open}>
        Add New Item
      </Button>
    </>
  );
}

export function InventoryTable() {

  return (
    <MantineProvider theme={{ variantColorResolver }}>
      <header id="header">
        <h1 id="logo"><a href="https://www.snstheatre.org">Scotch'n'Soda Theatre</a></h1>
        <nav id="nav">
          <ul>
            <li><a href="https://www.snstheatre.org/index">Home</a></li>
            <li><a href="https://www.snstheatre.org/about">About</a></li>
            <li><a href="https://www.snstheatre.org/getinvolved">Get Involved</a></li>
            <li><a href="https://www.snstheatre.org/season">Season</a></li>
            <li><a href="https://www.snstheatre.org/all_galleries">Photos</a></li>
            <li className="current"><a href="https://inventory.snstheatre.org/">Shop Inventory</a></li>
            <li><a href="https://www.snstheatre.org/give">Give</a></li>
            <li><a href="https://www.snstheatre.org/contact">Contact</a></li>
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
              justifyContent: "center",
              width: "100%",
              marginTop: "0px",
              marginBottom: "40px",
              gap: "30px",
            }}
          >
          <Inventory admin={true}/>
          </div>

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
        </Stack>
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
        backgroundImage: "url(/images/dark-tl.svg), url(/images/dark-tr.svg), url(/images/dark-bl.svg), url(/images/dark-br.svg)",
        backgroundPosition: "top left, top right, bottom left, bottom right",
        backgroundRepeat: "no-repeat",
        backgroundSize: "25em",
      }}
    >
      <InventoryTable></InventoryTable>
    </div>
  );
}
