import axios from "axios";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import {
  Image,
  Group,
  Text,
} from "@mantine/core";
import { IconUpload, IconX, IconPhoto } from "@tabler/icons-react";
import "./App.css";
import { Dropzone, IMAGE_MIME_TYPE, type FileWithPath } from "@mantine/dropzone";
import type { components } from "../api/schema";


type FileDumpSchema = components['schemas']['FileDumpSchema']

type FileEmbedProps = {
  file: FileDumpSchema;
};
export function ImageEmbed({ file }: FileEmbedProps) {
  return (
    <Image
      src={file.url}
      radius="md"
      h={300}
      w="auto"
      fit="contain"
      alt="Preview of uploaded photo"
      // Clean up memory if the component unmounts or changes
      onLoad={() => file && URL.revokeObjectURL(file.url)}
    />
  );
}


async function satisUploadFiles({ files }: { files: FileWithPath[] }) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }
  const response = await axios.post(
    "http://localhost:8000/files/upload",
    formData,
  );

  return response.data;
}

export function SatisDropzone() {
  return (
    <Dropzone
      onDrop={async (files) => {
        await satisUploadFiles({ files });
      }}
      onReject={(files) => console.log("rejected files", files)}
      maxSize={5 * 1024 ** 2}
      accept={IMAGE_MIME_TYPE}
    >
      <Group
        justify="center"
        gap="xl"
        mih={220}
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
            Attach as many files as you like, each file should not exceed 5mb
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
}

