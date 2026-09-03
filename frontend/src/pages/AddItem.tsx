import { Skeleton, TextInput, NumberInput, MultiSelect, Select, Textarea, Button, Group, Loader, Modal } from "@mantine/core";
import { useForm, } from "@mantine/form";
import { useEffect, Suspense, useMemo } from "react";
import { useNavigate, Outlet } from "react-router";
import { client } from "../api/client";
import type { components } from "../api/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";

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

type CategoryDumpSchema = components['schemas']['CategoryDumpSchema']
type LocationDumpSchema = components['schemas']['LocationDumpSchema']

export type AddUpdateItemFormValues = {
    name: string,
    name_verbose: string,
    quantity: number,
    current_location: string,
    permanent_location: LocationDumpSchema | null,
    categories: CategoryDumpSchema[],
    sub_categories: CategoryDumpSchema[],
    notes: string,
    file_id: number | null,
}

function MultiSelectWithObjects<T extends { id: number }>({
  data,
  getItemLabel,
  value,
  onChange,
  onFocus,
  onBlur,
  label,
  placeholder,
}: {
  data: T[]
  getItemLabel: (_: T) => string
  value: T[]
  onChange: (items: T[]) => void
  onFocus?: () => void
  onBlur?: () => void
  label?: string
  placeholder?: string
}) {
  const mappedData = useMemo(
    () => new Map(data.map((item) => [item.id.toString(), item])),
    [data]
  )

  const stringValue = value.map((item) => item.id.toString())

  return (
    <MultiSelect
      mt="sm"
      label={label}
      placeholder={placeholder}
      data={data.map((item) => ({
        value: item.id.toString(),
        label: getItemLabel(item),
      }))}
      value={stringValue}
      onChange={(selectedIds) => {
        const selectedObjects = selectedIds
          .map((id) => mappedData.get(id))
          .filter((item) => item !== undefined) as T[]
        onChange(selectedObjects)
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      searchable
    />
  )
}

export function AddNewCategory({type} : {type : string}) {
    const { data: categories } = (type === "primary") ? client.useQuery("post", "/inventory/categories/list_primary") : client.useQuery("post", "/inventory/categories/list_secondary");
    const form_inner = useForm ({
        mode: 'uncontrolled',
        initialValues: {category_name: ""},
        validate: {
            category_name: (value) => (value.length < 2 ? 'Category name must be at least two characters' : 
                                       (categories?.categories ?? []).some(cat => cat.name.toLowerCase().trim() === value.toLowerCase().trim()) ? 'Category name already exists' : null)
        }
    })
    const [opened_inner, { open, close }] = useDisclosure(false);
    const queryClient = useQueryClient();

    const { mutateAsync: handleAdd } = client.useMutation(
            'post',
            '/inventory/categories/create',
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: ["post", '/inventory/categories/list_primary'],
                  exact: false
                });
                queryClient.invalidateQueries({
                  queryKey: ["post", '/inventory/categories/list_secondary'],
                  exact: false
                });
                close()
              }
            }
        );

    const handleSubmit = form_inner.onSubmit(async (values ) => { try {
                await handleAdd({
                  body: {
                    name: values.category_name,
                    classification: type.toUpperCase()
                  }
                })
              } catch (error) {
                console.error('Failed to add category:', error);
                throw error;
              } });

    return (
        <>
            <Modal
                    centered={true}
                    size="auto"
                    opened={opened_inner}
                    onClose={close}
                    withCloseButton={false}
                    radius={0}
                    transitionProps={{ transition: 'fade', duration: 200 }}
                ><div onClick={(e) => e.stopPropagation()}>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit(e);
                    }} >

                        <TextInput
                            label="New Category Name"
                            {...form_inner.getInputProps('category_name')}
                        />

                        <Group justify="flex-end">
                            <Button
                            type="submit"
                            variant="light"
                            color="rgba(28, 61, 145, 1)"
                            disabled={form_inner.submitting}
                            rightSection={form_inner.submitting? <Loader size={16} /> : null}
                            >
                            {form_inner.submitting? 'Updating...' : 'Submit'}
                            </Button>
                        </Group>
                        </form>
                </div>
            </Modal>
            <Button variant="default"
                    radius="lg"
                    color="rgba(0, 0, 0, 1)"
                    size="compact-xs"
                    p={3}
                    styles={{section:{ marginRight: '3px' }}}
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}>
            Add New</Button>
        </>
    )
}


export function AddNewLocation() {
    const { data: locations } = client.useQuery("post", "/inventory/locations/list");
    const form_inner = useForm ({
        mode: 'uncontrolled',
        initialValues: {location_name: ""},
        validate: {
            location_name: (value) => (value.length < 2 ? 'Location name must be at least two characters' : 
                                        (locations?.locations ?? []).some(loc => loc.name.toLowerCase().trim() === value.toLowerCase().trim()) ? 'Location name already exists' : null)
        }
    })
    const [opened_inner, { open, close }] = useDisclosure(false);
    const queryClient = useQueryClient();

    const { mutateAsync: handleAdd } = client.useMutation(
            'post',
            '/inventory/locations/create',
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: ["post", '/inventory/locations/list'],
                  exact: false
                });
                close()
              }
            }
        );

    const handleSubmit = form_inner.onSubmit(async ( values ) => { try {
                await handleAdd({
                  body: {
                    name: values.location_name,
                  }
                })
              } catch (error) {
                console.error('Failed to add location:', error);
                throw error;
              } });

    return (
        <>
            <Modal
                    centered={true}
                    size="auto"
                    opened={opened_inner}
                    onClose={close}
                    withCloseButton={false}
                    radius={0}
                    transitionProps={{ transition: 'fade', duration: 200 }}
                ><div onClick={(e) => e.stopPropagation()}>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit(e);
                    }} >

                        <TextInput
                            label="New Permanent Location"
                            {...form_inner.getInputProps('location_name')}
                        />

                        <Group justify="flex-end">
                            <Button
                            type="submit"
                            variant="light"
                            color="rgba(28, 61, 145, 1)"
                            disabled={form_inner.submitting}
                            rightSection={form_inner.submitting? <Loader size={16} /> : null}
                            >
                            {form_inner.submitting? 'Updating...' : 'Submit'}
                            </Button>
                        </Group>
                        </form>
                </div>
            </Modal>
            <Button variant="default"
                    radius="lg"
                    color="rgba(0, 0, 0, 1)"
                    size="compact-xs"
                    p={3}
                    styles={{section:{ marginRight: '3px' }}}
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}>
            Add New</Button>
        </>
    )
}


export function AddUpdateItem({ onSubmit, initialValues, id
 }: { onSubmit: (_:AddUpdateItemFormValues) => Promise<void>, initialValues : AddUpdateItemFormValues, id: number | null }) {

  const { data: assets } = client.useQuery("post", "/inventory/asset/list", {body: { search: null }});
  const form = useForm <AddUpdateItemFormValues> ({
      mode: 'uncontrolled',
      initialValues: initialValues,
      validate: {
        name: (value) => (!value ? 'Name is required' : 
                          value.length > 15 ? 'Length of name must be less than 15 characters' : 
                          (assets?.elements ?? []).some(
                            asset => (asset.name.toLowerCase().trim() === value.toLowerCase().trim() &&
                            (id === null ||
                            asset.id !== id))) ? "Item name already exists" : null),
        name_verbose: (value) => (!value ? 'Description is required' : null),
        quantity: (value) => (value < 1 ? 'Quantity must be at least 1' : null),
        current_location: (value) => (!value ? 'Current location is required' : null),
        categories: (value) => (!value || value.length === 0 ? 'Must list at least one category' : null),
        sub_categories: (value) => (!value || value.length === 0 ? 'Must list at least one sub-category' : null),
      },
    });

    const { data: perm_locations } = client.useQuery("post", "/inventory/locations/list");

    const { data: categories } = client.useQuery("post", "/inventory/categories/list_primary");

    const { data: sub_categories } = client.useQuery("post", "/inventory/categories/list_secondary");

    const handleSubmit = form.onSubmit(async (values) => {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        throw error;
      }
    });
    return (
    <div onClick={(e) => e.stopPropagation()}>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>

          <TextInput
            label="Item Name"
            placeholder="e.g. fake ivy"
            {...form.getInputProps('name')}
          />

          <TextInput
            mt="sm"
            label="Description"
            placeholder="e.g. 12 foot vine of green ivy"
            {...form.getInputProps('name_verbose')}
          />

          <NumberInput
            mt="sm"
            label="Quantity"
            placeholder="Enter quantity"
            min={1}
            {...form.getInputProps('quantity')}
          />

          <TextInput
            mt="sm"
            label="Current Location"
            placeholder="Type where this item currently is"
            {...form.getInputProps('current_location')}
          />


          <Select
            mt="sm"
            label="Permanent Home"
            placeholder="Select permanent location"
            data={(perm_locations?.locations ?? []).map((loc) => ({
              value: loc.id.toString(),
              label: loc.name,
            }))}
            value={form.values.permanent_location?.id?.toString() ?? null}
            onChange={(val) => {
              const selected = (perm_locations?.locations ?? []).find(
                (loc) => loc.id.toString() === val
              ) ?? null;
              form.setFieldValue('permanent_location', selected);
            }}
            searchable
            clearable
          />
          <AddNewLocation></AddNewLocation>

          <MultiSelectWithObjects<CategoryDumpSchema>
            data={categories?.categories ?? []}
            getItemLabel={(cat) => cat.name}
            value={form.values.categories}
            onChange={(selected) => form.setFieldValue('categories', selected)}
            onFocus={() => form.setTouched({...form.isTouched, categories:true})}
            onBlur={() => form.setTouched({...form.isTouched, categories:true})}
            label="Categories"
            placeholder="Select categories"
          />
          <AddNewCategory type='primary'></AddNewCategory>

          <MultiSelectWithObjects<CategoryDumpSchema>
            data={sub_categories?.categories ?? []}
            getItemLabel={(cat) => cat.name}
            value={form.values.sub_categories}
            onChange={(selected) => form.setFieldValue('sub_categories', selected)}
            onFocus={() => form.setTouched({...form.isTouched, sub_categories:true})}
            onBlur={() => form.setTouched({...form.isTouched, sub_categories:true})}
            label="Sub Categories"
            placeholder="Select sub-categories"
          />
          <AddNewCategory type='secondary'></AddNewCategory>

          <Textarea
            mt="sm"
            label="Notes"
            placeholder="Add any additional notes"
            rows={4}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end">
            <Button
              type="submit"
              variant="light"
              color="rgba(28, 61, 145, 1)"
              disabled={form.submitting}
              rightSection={form.submitting? <Loader size={16} /> : null}
            >
              {form.submitting? 'Updating...' : 'Submit'}
            </Button>
          </Group>
      </form>
    </div>
    );
  }
