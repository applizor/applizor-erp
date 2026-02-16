export interface CMSPortal {
    id: string;
    companyId: string;
    clientId: string;
    name: string;
    subdomain: string;
    domain?: string;
    logo?: string;
    themeColor: string;
    themeLayout: 'standard' | 'magazine' | 'minimal';
    status: 'active' | 'inactive' | 'maintenance';
    createdAt: string;
    updatedAt: string;
}

export interface CMSPost {
    id: string;
    portalId: string;
    authorId: string;
    categoryId?: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string; // JSON or HTML
    featuredImage?: string;
    status: 'draft' | 'published' | 'archived';
    publishedAt?: string;
    seo?: CMSSEO;
    tags?: CMSTag[];
    category?: CMSCategory;
    author?: {
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CMSPage {
    id: string;
    portalId: string;
    title: string;
    slug: string;
    content: string;
    isPublished: boolean;
    seo?: CMSSEO;
    createdAt: string;
    updatedAt: string;
}

export interface CMSMenu {
    id: string;
    portalId: string;
    name: string;
    location: 'header' | 'footer' | 'sidebar';
    items: any; // JSON
}

export interface CMSCategory {
    id: string;
    portalId: string;
    name: string;
    slug: string;
    parentId?: string;
}

export interface CMSTag {
    id: string;
    portalId: string;
    name: string;
    slug: string;
}

export interface CMSSEO {
    id: string;
    metaTitle?: string;
    metaDescription?: string;
    focusKeywords?: string;
}

export interface NewsletterSubscriber {
    id: string;
    portalId: string;
    email: string;
    isActive: boolean;
    createdAt: string;
}
