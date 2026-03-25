export interface User {
    id: string;
    email: string;
    fullName?: string;
    imageUrl?: string;
    name?: string;
    image?: string;
}

export interface Message {
    id: string;
    role: any;
    content: string;
    timestamp: string;
}

export interface Version {
    id: string;
    timestamp: string;
    code: string;
}

export interface PageVersion {
    id: string;
    code: string;
    description?: string;
    timestamp: string;
}

export interface Page {
    id: string;
    name: string;
    slug: string;
    current_code: string | null;
    current_version_index: string;
    projectId: string;
    order: number;
    createdAt: string;
    updatedAt: string;
    versions: PageVersion[];
}

export interface Project {
    id: string;
    name: string;
    initial_prompt: string;
    current_code: string;
    current_version_index: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user?: User;
    isPublished?: boolean;
    conversation: Message[];
    versions?: Version[];
    pages?: Page[];
}