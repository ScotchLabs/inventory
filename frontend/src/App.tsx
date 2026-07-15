import { useState } from 'react'
import { client } from './api/client'
import '@mantine/core/styles.css'
import { Table, MantineProvider } from '@mantine/core'
import './App.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import type { components } from './api/schema'
type Asset = components['schemas']['AssetDumpSchema']


function Test() {
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
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Item</Table.Th>
          <Table.Th>Short Description</Table.Th>
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
  );
}

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
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Item</Table.Th>
          <Table.Th>Short Description</Table.Th>
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
  );
}


function Button({
  username
}: {
  username: string
}) {
  const {mutate: createUser} = client.useMutation(
    'post', '/',

  )
  return <button
          type="button"
          className="counter"
          onClick={async () => {
            await createUser({
              body: {
                username,
            }
            })
          }}
        >
        Create {username}
        </button>
}


export default function App() {
  const queryClient = new QueryClient();


  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <InventoryPublic></InventoryPublic>
      </QueryClientProvider>
    </MantineProvider>
  )
}