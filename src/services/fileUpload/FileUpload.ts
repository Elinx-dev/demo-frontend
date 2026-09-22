const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type FileUploadResponse = Record<string, unknown>;

export const getUploadedFileUrl = (response: unknown): string => {
    if (typeof response === "string") return response;

    const payload = response as FileUploadResponse | undefined;
    const nested = payload?.data as FileUploadResponse | undefined;

    if (typeof payload?.data === "string") return payload.data;

    const url =
        payload?.url ??
        payload?.blobUrl ??
        payload?.blobLink ??
        payload?.blob_url ??
        payload?.blob_link ??
        payload?.fileUrl ??
        payload?.filePath ??
        payload?.file_url ??
        payload?.file_path ??
        nested?.url ??
        nested?.blobUrl ??
        nested?.blobLink ??
        nested?.blob_url ??
        nested?.blob_link ??
        nested?.fileUrl ??
        nested?.filePath ??
        nested?.file_url ??
        nested?.file_path;

    return typeof url === "string" ? url : "";
};

export const uploadFile = async (file: File) => {
    
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${baseUrl}/api/v1/ipc/file_service/upload`, {
        method: "POST",
        body:formData,
    })

    if (!res.ok) {
        throw new Error('File upload failed')
        
    }
    return res.json();
}

export const downloadFile = async (fileName: string) => {
    const res = await fetch(`${baseUrl}/api/v1/ipc/file_service/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName }),
    });

    if (!res.ok) {
        throw new Error('File download failed');
    }
    return res.blob();
}

