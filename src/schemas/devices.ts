export interface Device {
    id: number;
    title: string;
    manufacturer: string;
    model: string;
    ipAddress: string;
    sshPort: number;
    username: string;
}

export interface PaginatedDeviceResponse {
    content: Device[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}