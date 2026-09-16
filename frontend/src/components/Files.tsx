import axios from "axios";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import {
  Image,
  Box,
  Group,
  Text,
  ActionIcon,
  Stack,
  Button,
  Modal,
  Anchor,
} from "@mantine/core";
import { IconUpload, IconX, IconTrash, IconPhoto } from "@tabler/icons-react";
import {
  Dropzone,
  IMAGE_MIME_TYPE,
  type FileWithPath,
} from "@mantine/dropzone";
import { type FileDumpSchema, type FileListDumpSchema } from "../types";
import { API_URL } from "../environment";
import { useEffect, useState } from "react";

type FileEmbedProps = {
  file: FileDumpSchema;
  h?: number | "auto";
  w?: number | "auto";
  onDelete?: () => void;
};

export function SatisImageEmbed({
  file,
  h = "auto",
  w = "auto",
  onDelete,
}: FileEmbedProps) {
  return (
    <Box
      pos="relative"
      w={w}
      h={h}
      style={{
        borderRadius: "var(--mantine-radius-md)",
        overflow: "hidden",
        pointerEvents: "all",
        maxHeight: "80vh",
        maxWidth: "90vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <Image
        src={file.url}
        h="100%"
        w="100%"
        fit="contain"
        alt="File upload"
        style={{ maxHeight: "80vh", maxWidth: "90vw" }}
      />

      {onDelete && (
        <ActionIcon
          size="sm"
          radius="xl"
          variant="filled"
          color="dark"
          pos="absolute"
          top={6}
          right={6}
          style={{ zIndex: 2 }}
          onClick={() => onDelete()}
        >
          <IconTrash size={14} />
        </ActionIcon>
      )}
    </Box>
  );
}

export function SatisImageEmbedModal({
  file,
  opened,
  onClose,
}: {
  file: FileDumpSchema;
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal opened={opened} title={file.filename} onClose={onClose} size="auto">
      <SatisImageEmbed file={file} />
    </Modal>
  );
}

export function SatisImageEmbedModalButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      variant="default"
      radius="lg"
      color="rgba(0, 0, 0, 1)"
      size="compact-xs"
      p={3}
      leftSection={<IconPhoto size={16} />}
      styles={{ section: { marginRight: "3px" } }}
      onClick={onClick}
    >
      View file
    </Button>
  );
}

async function satisUploadFiles({ files }: { files: FileWithPath[] }) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }
  const response = await axios.post(`${API_URL}/files/upload`, formData, {
    withCredentials: true,
  });

  return response.data as FileListDumpSchema;
}

export function SatisDropzone({
  initialFiles,
  onChange,
}: {
  initialFiles: FileDumpSchema[];
  onChange: (_: FileDumpSchema[]) => void;
}) {
  const [fileState, setFileState] = useState<FileDumpSchema[]>(initialFiles);
  useEffect(() => onChange(fileState), [fileState]);
  return (
    <Dropzone
      onDrop={async (files) => {
        const fileResult = await satisUploadFiles({ files });
        setFileState([...fileState, ...fileResult.elements]);
      }}
      onReject={(files) => console.log("rejected files", files)}
      maxSize={5 * 1024 ** 2}
      accept={IMAGE_MIME_TYPE}
    >
      <Stack gap="md">
        {fileState.length > 0 && (
          <Group gap="sm" wrap="wrap">
            {fileState.map((file) => (
              <SatisImageEmbed
                key={file.url}
                file={file}
                w={100}
                h={100}
                onDelete={() => {
                  setFileState((current) =>
                    current.filter((item) => item !== file),
                  );
                }}
              />
            ))}
          </Group>
        )}

        <Group
          justify="center"
          gap="xl"
          mih={50}
          style={{ pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <IconUpload size={52} color="var(--mantine-color-blue-6)" />
          </Dropzone.Accept>

          <Dropzone.Reject>
            <IconX size={52} color="var(--mantine-color-red-6)" />
          </Dropzone.Reject>

          <Dropzone.Idle>
            <IconPhoto size={52} color="var(--mantine-color-dimmed)" />
          </Dropzone.Idle>
          <div>
            <Text size="xl" inline>
              Drag images here or click to select files
            </Text>

            <Text size="sm" c="dimmed" inline mt={7}>
              Each file should not exceed 5mb
            </Text>
          </div>
        </Group>
      </Stack>
    </Dropzone>
  );
}

export function FileLink({ file }: { file: FileDumpSchema }) {
  return (
    <Anchor
      key={file.id}
      href={file.url}
      target="_blank"
      rel="noreferrer noopener"
    >
      <IconPhoto size={20} color="var(--mantine-color-dimmed)" />
    </Anchor>
  );
}
