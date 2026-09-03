import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
} from "react-router";
import { PublicTable } from "./pages/Public";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminPage, AdminProvider } from './pages/Admin'

const queryClient = new QueryClient();

function BaseProvider() {
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </MantineProvider>
  );
}

const router = createBrowserRouter([
  {
    Component: BaseProvider,
    children: [
      { index: true, path: "/", Component: PublicTable },
      {
        path: "/admin",
        Component: AdminProvider,
        children: [{ path: "", Component: AdminPage }],
      },
    ],
  },
]);
const App = () => <RouterProvider router={router} />;

export default App;
