import { useState } from 'react'
import { client } from './api/client'
import '@mantine/core/styles.css'
import { Table, MantineProvider, Stack, Button } from '@mantine/core'
import './App.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import sns_logo from "./assets/sns_logo.png"

import type { components } from './api/schema'
type Asset = components['schemas']['AssetDumpSchema']


function InventoryPublic() {
  const { data: assets } = client.useQuery('get', '/inventory/assets/')
  if (!assets) return <div>Loading...</div>

  const rows = assets.map((asset) => (
    <Table.Tr key={asset.name}>
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
    <div style={{ display: 'inline-block', maxWidth: '100%' }}>
      <Table.ScrollContainer minWidth={500} maxHeight={300}>
        <Table withTableBorder highlightOnHover stickyHeader stickyHeaderOffset={60}>
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
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </div>
  );
}

function Admin({
  username
}: {
  username: string
}) {
  const {mutate: createUser} = client.useMutation(
    'post', '/',

  )
  return <Button
          variant="filled"
          color="grape" 
          radius="lg"
          size="compact-sm"
          onClick={async () => {
            await createUser({
              body: {
                username,
            }
            })
          }}
        >
        Admin Login
        </Button>
}


export default function App() {
  const queryClient = new QueryClient();
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <div style = {{ display: "flex", 
                          alignItems: "center", 
                          marginTop: '20px',
                          width: "90%",
                          margin: "0 auto",
                          gap: "50px" }}>
              <img src = {sns_logo} alt = "logo" width="150">
              </img>

              <div>
                <h2 style = {{ color: "black", fontSize: '32px'}}> Scotch'n'Soda Shop Inventory</h2>
                <p style = {{ fontSize: '12px' }}> Built and mainted by Will & Madison</p>
              </div>

              <div style={{ marginLeft: "auto" }}>
                <Admin username="admin"></Admin>
                <p style={{ fontSize: '12px', 
                            maxWidth: '300px', 
                            marginTop: '10px',
                            minWidth: 0 }}>
                 If you are a TAH looking to add or remove an item, please log in as admin.
                </p>
              </div>
          </div>

          <div style = {{ display: "flex", 
                          alignItems: "center", 
                          marginTop: '40px',
                          width: "80%",
                          margin: "0 auto",
                          gap: "30px" }}>
            <InventoryPublic></InventoryPublic>
          </div>
        </Stack>


      </QueryClientProvider>
    </MantineProvider>
  )
}