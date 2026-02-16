import api from '../api';
import { CMSPortal, CMSPost, CMSPage, CMSMenu, NewsletterSubscriber } from '../../types/cms';

export const cmsApi = {
    // Portal
    getPortal: () => api.get<CMSPortal>('/cms/portal'),
    updatePortal: (data: Partial<CMSPortal>) => api.patch<CMSPortal>('/cms/portal', data),
    updateAdSettings: (data: any) => api.patch('/cms/portal/ads', data),

    // Posts
    getPosts: (params?: any) => api.get<CMSPost[]>('/cms/posts', { params }),
    createPost: (data: any) => api.post<CMSPost>('/cms/posts', data),
    updatePost: (id: string, data: any) => api.patch<CMSPost>(`/cms/posts/${id}`, data),
    deletePost: (id: string) => api.delete(`/cms/posts/${id}`),

    // Pages
    getPages: () => api.get<CMSPage[]>('/cms/pages'),
    createPage: (data: any) => api.post<CMSPage>('/cms/pages', data),
    updatePage: (id: string, data: any) => api.patch<CMSPage>(`/cms/pages/${id}`, data),
    deletePage: (id: string) => api.delete(`/cms/pages/${id}`),

    // Menus
    getMenus: () => api.get<CMSMenu[]>('/cms/menus'),
    updateMenu: (id: string, items: any[]) => api.patch<CMSMenu>(`/cms/menus/${id}`, { items }),

    // Categories
    getCategories: () => api.get<any[]>('/cms/categories'), // Replace any with CMSCategory type
    createCategory: (data: any) => api.post<any>('/cms/categories', data),

    // Newsletter
    getSubscribers: () => api.get<NewsletterSubscriber[]>('/cms/subscribers'),
    // subscribe and unsubscribe are public APIs usually, but admin might need to manage them too?
    // exposing here for admin management if needed, though mostly public.

    // AI
    generateHeadline: (title: string) => api.post<{ title: string }>('/cms/ai/headline', { title }),
    generateSEO: (content: string) => api.post<{ metaDescription: string, focusKeywords: string }>('/cms/ai/seo', { content }),
};
