import { createBrowserRouter, Outlet, RouterProvider, useNavigate } from 'react-router'
import { PublicTable } from './pages/Public'
import { MantineProvider, Skeleton, Text } from '@mantine/core';
import { client } from './api/client';
import { Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function BaseProvider() {
  return <MantineProvider>
          <QueryClientProvider client={queryClient}>
                <Outlet/>
          </QueryClientProvider>
        </MantineProvider>
}
function EnsureLogin() {
  const { data: session} = client.useSuspenseQuery('get', '/users/users/current-session')
  const navigate = useNavigate()
  useEffect(() => {
    if (!session.user){
      navigate("/")
    }
    }, [session])
    return <></>
}

function AdminProvider() {
  return <Suspense fallback={
        <Skeleton height={8} mt={6} width="70%" radius="xl" />
  }>
    <EnsureLogin/>
    <Outlet/>
    </Suspense>
}

function AdminPage() {
  return <Text>Hello world</Text>
}

const router = createBrowserRouter([
  {
    Component: BaseProvider,
    children: [
      { index: true, path: "/", Component: PublicTable },
      { path: "/admin", Component: AdminProvider, children: [
        {path: "", Component: AdminPage}
      ]
      }
    ],
  },
]);
const App = () => <RouterProvider router={router} />;

export default App;