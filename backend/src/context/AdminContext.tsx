import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminData, UserItem, AlertItem } from '../types';
import { api, API_URL } from '../api/client';
import { ConfirmModal, ConfirmState } from '../components/ConfirmModal';

const EMPTY_ADMIN_DATA: AdminData = {
  settings: {
    site_title: 'The First Seven Years',
    site_tagline: '',
    canonical_domain: 'https://thefirstsevenyears.com',
    youtube_channel: '',
    contact_email: '',
    medical_disclaimer: '',
    brand_colors: {
      navy: '#2b3c56',
      mint: '#bfe4c6',
      cream: '#f8f5ec',
      peach: '#fad7c4',
      butter: '#fbe7ac',
      lilac: '#e3dcf7',
      soft_green: '#d6ecdf',
      sky: '#cfe6f2'
    },
    security: {
      session_timeout: '60',
      two_factor_enabled: false,
      last_password_change: '',
      current_user_password_hash: ''
    },
    organization: {
      support_phone: '',
      office_location: '',
      copyright_notice: `© ${new Date().getFullYear()} The First Seven Years. All rights reserved.`,
      social_twitter: '',
      social_instagram: '',
      social_linkedin: ''
    },
    notifications: {
      recipient_emails: '',
      emergency_sms: '',
      frequency: 'immediate',
      sound_alarm: true,
      browser_push: true,
      email_new_submissions: true,
      email_red_flags: true,
      email_clinical_reminders: true,
      video_updates: true,
      security_logins: true
    },
    promo_banner: {
      enabled: false
    }
  },
  alerts: [],
  topics: [],
  answers: [],
  faqs: [],
  videos: [],
  experts: {},
  users: [],
  roles: {},
  ask_submissions: [],
  menus: { header: [], footer: [] },
  pages: [],
  banners: []
};

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmActionOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  icon?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface AdminContextType {
  data: AdminData;
  currentUser: UserItem;
  currentRole: string;
  isAuthenticated: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
  isDbConnected: boolean;
  refreshData: () => Promise<void>;
  searchQuery: string;
  toasts: Toast[];
  confirmAction: (options: ConfirmActionOptions) => void;
  setSearchQuery: (q: string) => void;
  switchUser: (userId: string) => void;
  togglePublish: (type: string, idKey: string, idVal: any) => void;
  deleteItem: (type: string, idKey: string, idVal: any) => void;
  saveItem: (type: string, item: any, idKey: string) => void;
  convertSubmissionToAnswer: (subId: string) => void;
  approveClinical: (answerSlug: string) => void;
  toggleAlertRead: (alertId: string) => void;
  markAllAlertsRead: () => void;
  resetToDefaults: () => void;
  exportData: () => void;
  rebuildSite: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  can: (action: string) => boolean;
  canEdit: (moduleId: string) => boolean;
  canView: (moduleId: string) => boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge any stale dummy data cached in localStorage
  try {
    localStorage.removeItem('f7_admin_content');
  } catch (e) {}

  const [data, setData] = useState<AdminData>(EMPTY_ADMIN_DATA);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('f7_active_user') || 'usr-1';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const confirmAction = (options: ConfirmActionOptions) => {
    setConfirmState({
      isOpen: true,
      title: options.title || 'Are you sure?',
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      isDanger: options.isDanger !== false,
      icon: options.icon,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  };

  const closeConfirm = () => setConfirmState(null);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/data');
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
        setIsDbConnected(true);
      }
    } catch (err) {
      console.warn('Node API not reachable:', err);
      setIsDbConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync initial state from Node.js API using Axios
  useEffect(() => {
    let active = true;
    const fetchRemote = async () => {
      try {
        const res = await api.get('/admin/data');
        if (res.data?.success && res.data.data && active) {
          setData(res.data.data);
          setIsDbConnected(true);
        }
      } catch (err) {
        console.warn('Node API not reachable:', err);
        if (active) setIsDbConnected(false);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchRemote();
    return () => {
      active = false;
    };
  }, []);

  const currentUser = data.users?.find((u) => u.id === currentUserId) || data.users?.[0] || {
    id: 'usr-1',
    name: 'Dr. Murray Clarke',
    email: 'murray@thefirstsevenyears.com',
    role: 'super_admin' as const,
    status: 'Active',
    last_active: 'Just now',
    permissions: {}
  };

  const currentRole = currentUser.role;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const persistData = (updated: AdminData, msg?: string) => {
    setData(updated);

    // Sync to Node.js backend using Axios
    api.post('/admin/bulk-update', updated).catch((err) => {
      console.warn('Failed to sync to Node API:', err);
    });

    if (msg) showToast(msg, 'success');
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!(localStorage.getItem('f7_auth_user') || sessionStorage.getItem('f7_auth_user'));
  });

  const login = async (
    username: string,
    password: string,
    remember: boolean = true
  ): Promise<{ success: boolean; message?: string }> => {
    const ident = username.trim().toLowerCase();
    const pwd = password.trim();

    if (!ident) {
      return { success: false, message: 'Please enter your username' };
    }

    try {
      // Connect to Node.js / Prisma MySQL backend using Axios
      const res = await api.post('/auth/login', { username: ident, password: pwd });
      const result = res.data;

      if (result?.success && result.user) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('f7_auth_user', JSON.stringify(result.user));
        if (result.token) {
          storage.setItem('f7_auth_token', result.token);
        }
        localStorage.setItem('f7_active_user', result.user.id);

        setCurrentUserId(result.user.id);
        setIsAuthenticated(true);
        showToast(result.message || `Signed in successfully as ${result.user.name}`, 'success');
        return { success: true };
      } else {
        return {
          success: false,
          message: result?.message || 'Invalid username or password. Please use admin / admin@999999'
        };
      }
    } catch (err: any) {
      console.error('Node.js authentication error:', err);
      const serverMsg = err.response?.data?.message;
      return {
        success: false,
        message: serverMsg || 'Could not connect to nodeserver. Please ensure the backend is running at http://localhost:5000'
      };
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('f7_auth_user');
    sessionStorage.removeItem('f7_auth_user');
    localStorage.removeItem('f7_auth_token');
    localStorage.removeItem('f7_active_user');
    setIsAuthenticated(false);
    showToast('You have been logged out.', 'info');
  };

  const switchUser = (userId: string) => {
    const u = data.users?.find((x) => x.id === userId);
    if (!u) return;
    setCurrentUserId(userId);
    localStorage.setItem('f7_active_user', userId);
    showToast(`Switched active user to ${u.name} (${u.role})`, 'info');
  };

  const canEdit = (moduleId: string): boolean => {
    if (currentRole === 'super_admin') return true;
    const cleanMod = moduleId === 'menu_header' || moduleId === 'menu_footer' ? 'menus' : moduleId;
    const perm = currentUser.permissions?.[cleanMod];
    if (perm === 'edit') return true;
    if (perm === 'view' || perm === 'hide') return false;
    if (currentRole === 'editor') return !['roles', 'settings'].includes(cleanMod);
    if (currentRole === 'clinical_reviewer') return ['answers', 'submissions'].includes(cleanMod);
    if (currentRole === 'author') return ['answers', 'faqs'].includes(cleanMod);
    return false;
  };

  const canView = (moduleId: string): boolean => {
    if (currentRole === 'super_admin') return true;
    const cleanMod = moduleId === 'menu_header' || moduleId === 'menu_footer' ? 'menus' : moduleId;
    if (cleanMod === 'settings' && currentRole === 'editor') return true;
    const perm = currentUser.permissions?.[cleanMod];
    if (perm === 'view' || perm === 'edit') return true;
    if (perm === 'hide') return false;
    if (currentRole === 'editor') return true;
    if (currentRole === 'clinical_reviewer') return !['menus', 'roles'].includes(cleanMod);
    if (currentRole === 'author') return ['dashboard', 'topics', 'answers', 'faqs', 'videos', 'experts'].includes(cleanMod);
    return true;
  };

  const can = (action: string): boolean => {
    if (currentRole === 'super_admin') return true;
    const map: Record<string, string> = {
      manage_topics: 'topics',
      manage_answers: 'answers',
      manage_faqs: 'faqs',
      manage_videos: 'videos',
      manage_youtube: 'youtube',
      manage_experts: 'experts',
      manage_pages: 'pages',
      manage_menus: 'menus',
      manage_users: 'roles',
      manage_settings: 'settings',
      review_clinical: 'answers',
      rebuild_site: 'dashboard',
      publish_content: 'dashboard'
    };
    const mod = map[action];
    return mod ? canEdit(mod) : false;
  };

  const togglePublish = (type: string, idKey: string, idVal: any) => {
    const cleanMod = type === 'menu_header' || type === 'menu_footer' ? 'menus' : type;
    if (!canEdit(cleanMod)) {
      showToast('Access restricted: You have read-only permissions and cannot change publish status.', 'error');
      return;
    }

    // Determine current item publish state and friendly name
    let currentItem: any = null;
    let itemTitle = '';

    if (type === 'videos') {
      const allVideos = (data as any).videos || [];
      const allEpisodes = (data as any).episodes || [];
      currentItem = (Array.isArray(allVideos) ? allVideos.find((x: any) => x[idKey] === idVal) : null) ||
                    (Array.isArray(allEpisodes) ? allEpisodes.find((x: any) => x[idKey] === idVal) : null);
      itemTitle = currentItem?.title || currentItem?.id || 'this video';
    } else {
      let collection: any;
      if (type === 'menu_header') collection = data.menus?.header;
      else if (type === 'menu_footer') collection = data.menus?.footer;
      else collection = (data as any)[type];

      if (Array.isArray(collection)) {
        currentItem = collection.find((x: any) => x[idKey] === idVal);
      } else if (collection && collection[idVal]) {
        currentItem = collection[idVal];
      }
      itemTitle = currentItem?.title || currentItem?.name || currentItem?.label || currentItem?.question || currentItem?.slug || 'this item';
    }

    const willPublish = !currentItem?.published;
    const confirmButtonText = willPublish ? 'Publish to Live' : 'Move to Draft';
    const confirmIcon = willPublish ? '🌐' : '📝';

    confirmAction({
      title: willPublish ? 'Publish to Live Website?' : 'Change to Draft Status?',
      message: willPublish
        ? `Are you sure you want to publish "${itemTitle}"? It will become visible on the live website.`
        : `Are you sure you want to change "${itemTitle}" to Draft? It will be hidden from the live website.`,
      confirmText: confirmButtonText,
      cancelText: 'Cancel',
      icon: confirmIcon,
      isDanger: !willPublish,
      onConfirm: () => {
        const updated = JSON.parse(JSON.stringify(data));
        let collection: any;
        if (type === 'videos') {
          let isPub = false;
          if (Array.isArray(updated.videos)) {
            const item = updated.videos.find((x: any) => x[idKey] === idVal);
            if (item) {
              item.published = !item.published;
              isPub = item.published;
            }
          }
          if (Array.isArray(updated.episodes)) {
            const item = updated.episodes.find((x: any) => x[idKey] === idVal);
            if (item) {
              item.published = !item.published;
              isPub = item.published;
            }
          }
          persistData(updated, `Video marked as ${isPub ? 'Published' : 'Draft'}`);
        } else {
          if (type === 'menu_header') collection = updated.menus?.header;
          else if (type === 'menu_footer') collection = updated.menus?.footer;
          else collection = updated[type];

          if (!collection) return;

          if (Array.isArray(collection)) {
            const item = collection.find((x: any) => x[idKey] === idVal);
            if (item) {
              item.published = !item.published;
              persistData(updated, `Item marked as ${item.published ? 'Published' : 'Draft'}`);
            }
          } else if (collection[idVal]) {
            collection[idVal].published = !collection[idVal].published;
            persistData(updated, `Item marked as ${collection[idVal].published ? 'Published' : 'Draft'}`);
          }
        }

        api.post('/admin/toggle-publish', { type, idKey, idVal }).catch((err) =>
          console.error('Error toggling publish on server:', err)
        );
      }
    });
  };

  const deleteItem = (type: string, idKey: string, idVal: any) => {
    const cleanMod = type === 'menu_header' || type === 'menu_footer' ? 'menus' : type;
    if (!canEdit(cleanMod)) {
      showToast('Access restricted: You have read-only permissions and cannot delete items.', 'error');
      return;
    }
    confirmAction({
      title: 'Delete Item?',
      message: 'Are you sure you want to delete this item? This action will permanently remove it.',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      isDanger: true,
      icon: '🗑️',
      onConfirm: () => {
        const updated = JSON.parse(JSON.stringify(data));
        if (type === 'videos') {
          if (Array.isArray(updated.videos)) {
            updated.videos = updated.videos.filter((x: any) => x[idKey] !== idVal);
          }
          if (Array.isArray(updated.episodes)) {
            updated.episodes = updated.episodes.filter((x: any) => x[idKey] !== idVal);
          }
        } else if (type === 'menu_header') {
          updated.menus.header = updated.menus.header.filter((x: any) => x[idKey] !== idVal);
        } else if (type === 'menu_footer') {
          updated.menus.footer = updated.menus.footer.filter((x: any) => x[idKey] !== idVal);
        } else if (Array.isArray(updated[type])) {
          updated[type] = updated[type].filter((x: any) => x[idKey] !== idVal);
        } else if (updated[type] && updated[type][idVal]) {
          delete updated[type][idVal];
        }
        persistData(updated, 'Item deleted successfully');

        api.post('/admin/delete-item', { type, idKey, idVal }).catch((err) =>
          console.error('Error deleting item on server:', err)
        );
      },
    });
  };

  const saveItem = (type: string, item: any, idKey: string) => {
    const cleanMod = type === 'menu_header' || type === 'menu_footer' ? 'menus' : type;
    if (!canEdit(cleanMod)) {
      showToast('Access restricted: You have read-only permissions and cannot modify items in this module.', 'error');
      return;
    }
    const updated = JSON.parse(JSON.stringify(data));
    const val = item[idKey];

    if (type === 'menu_header') {
      const idx = updated.menus.header.findIndex((x: any) => x[idKey] === val);
      if (idx !== -1) updated.menus.header[idx] = item;
      else updated.menus.header.push(item);
    } else if (type === 'menu_footer') {
      const idx = updated.menus.footer.findIndex((x: any) => x[idKey] === val);
      if (idx !== -1) updated.menus.footer[idx] = item;
      else updated.menus.footer.push(item);
    } else if (type === 'videos') {
      if (!Array.isArray(updated.videos)) updated.videos = [];
      const idx = updated.videos.findIndex((x: any) => x[idKey] === val);
      if (idx !== -1) {
        updated.videos[idx] = { ...updated.videos[idx], ...item };
      } else {
        updated.videos.unshift(item);
      }
      if (Array.isArray(updated.episodes)) {
        const epIdx = updated.episodes.findIndex((x: any) => x[idKey] === val);
        if (epIdx !== -1) {
          updated.episodes[epIdx] = { ...updated.episodes[epIdx], ...item };
        } else {
          updated.episodes.unshift(item);
        }
      }
    } else if (type === 'experts') {
      if (Array.isArray(updated.experts)) {
        const idx = updated.experts.findIndex((x: any) => x[idKey] === val);
        if (idx !== -1) updated.experts[idx] = item;
        else updated.experts.push(item);
      } else if (updated.experts) {
        updated.experts[val] = item;
      }
      // Sync local answers state
      if (Array.isArray(item.answers) && Array.isArray(updated.answers)) {
        updated.answers.forEach((ans: any) => {
          if (item.answers.includes(ans.slug)) {
            ans.expert = val;
          } else if (ans.expert === val) {
            ans.expert = null;
          }
        });
      }
      // Sync local videos/episodes state
      if (Array.isArray(item.episodes)) {
        if (Array.isArray(updated.videos)) {
          updated.videos.forEach((v: any) => {
            const isMatch =
              item.episodes.includes(v.id) ||
              (v.youtube_id && item.episodes.includes(v.youtube_id)) ||
              (v.slug && item.episodes.includes(v.slug));
            if (isMatch) {
              v.expert = val;
              v.guest = val;
              v.published = true;
            } else if (v.expert === val || v.guest === val) {
              v.expert = null;
              v.guest = null;
            }
          });
        }
        if (Array.isArray(updated.episodes)) {
          updated.episodes.forEach((e: any) => {
            const isMatch =
              item.episodes.includes(e.id) ||
              (e.youtube_id && item.episodes.includes(e.youtube_id)) ||
              (e.slug && item.episodes.includes(e.slug));
            if (isMatch) {
              e.expert = val;
              e.guest = val;
              e.published = true;
            } else if (e.expert === val || e.guest === val) {
              e.expert = null;
              e.guest = null;
            }
          });
        }
      }
    } else if (type === 'settings') {
      const cleanSettings = { ...item };
      delete cleanSettings['The First Seven Years'];
      if (cleanSettings.site_title) delete cleanSettings[cleanSettings.site_title];
      updated.settings = cleanSettings;
    } else if (type === 'banners') {
      if (!Array.isArray(updated.banners)) updated.banners = [];
      const idx = updated.banners.findIndex((x: any) => x[idKey] === val);
      if (idx !== -1) updated.banners[idx] = item;
      else updated.banners.push(item);
    } else if (Array.isArray(updated[type])) {
      const idx = updated[type].findIndex((x: any) => x[idKey] === val);
      if (idx !== -1) updated[type][idx] = item;
      else updated[type].push(item);
    } else if (updated[type]) {
      updated[type][val] = item;
    }
    persistData(updated, 'Saved successfully!');

    api.post('/admin/save-item', { type, item, idKey })
      .then((res) => {
        if (res.data?.success) {
          console.log(`[DB] Successfully saved ${type} (${val}) to MySQL database.`);
        }
      })
      .catch((err) => {
        console.error(`[DB] Error saving ${type} to MySQL:`, err);
        showToast(`Warning: Failed to persist to MySQL (${err.response?.data?.message || err.message})`, 'error');
      });
  };

  const convertSubmissionToAnswer = (subId: string) => {
    const sub = data.ask_submissions?.find((s) => s.id === subId);
    if (!sub) return;
    const slug = 'q-' + Date.now();
    const newAnswer = {
      slug,
      question: sub.question,
      short_answer: 'Clinical answer in progress by Dr. Murray Clarke.',
      body: ['Draft answer body based on inbound parent question.'],
      topic: sub.topic || 'gut-health',
      topics: sub.topics || [sub.topic || 'gut-health'],
      ages: [0, 1, 2, 3, 4, 5, 6, 7],
      expert: 'dr-murray-clarke',
      reviewed_by: 'Dr. Murray Clarke',
      reviewed_at: new Date().toISOString().split('T')[0],
      published: false
    };

    const updated = JSON.parse(JSON.stringify(data));
    if (Array.isArray(updated.answers)) {
      updated.answers.unshift(newAnswer);
    } else {
      updated.answers[slug] = newAnswer;
    }
    const s = updated.ask_submissions.find((x: any) => x.id === subId);
    if (s) s.status = 'Answered';

    persistData(updated, 'Converted submission into new Q&A draft!');

    api.post(`/submissions/${subId}/convert`).catch((err) =>
      console.error('Error converting submission on server:', err)
    );
  };

  const approveClinical = (answerSlug: string) => {
    const updated = JSON.parse(JSON.stringify(data));
    let ans: any = null;
    if (Array.isArray(updated.answers)) {
      ans = updated.answers.find((a: any) => a.slug === answerSlug);
    } else if (updated.answers?.[answerSlug]) {
      ans = updated.answers[answerSlug];
    }
    if (ans) {
      ans.reviewed_by = currentUser.name;
      ans.reviewed_at = new Date().toISOString().split('T')[0];
      ans.published = true;
      persistData(updated, `Clinically approved by ${currentUser.name}!`);

      api.post(`/answers/${answerSlug}/approve`, { reviewed_by: currentUser.name }).catch((err) =>
        console.error('Error approving clinical answer on server:', err)
      );
    }
  };

  const toggleAlertRead = (alertId: string) => {
    const updated = JSON.parse(JSON.stringify(data));
    const alt = updated.alerts?.find((a: AlertItem) => a.id === alertId);
    if (alt) {
      alt.unread = !alt.unread;
      persistData(updated);
    }
  };

  const markAllAlertsRead = () => {
    const updated = JSON.parse(JSON.stringify(data));
    updated.alerts?.forEach((a: AlertItem) => {
      a.unread = false;
    });
    persistData(updated, 'All alerts marked as read');
  };

  const resetToDefaults = async () => {
    confirmAction({
      title: 'Reset Database Defaults?',
      message: 'Are you sure you want to reset all data back to original defaults? All custom changes will be reverted.',
      confirmText: 'Reset Defaults',
      cancelText: 'Cancel',
      isDanger: true,
      icon: '⚠️',
      onConfirm: async () => {
        try {
          const res = await api.post('/admin/reset');
          if (res.data?.success && res.data.data) {
            setData(res.data.data);
            setIsDbConnected(true);
            showToast('Reset database to default seed data via Node API!', 'info');
            return;
          }
        } catch (e) {
          console.error('Node API reset failed:', e);
          showToast('Failed to reset database via Node API', 'error');
        }
      },
    });
  };

  const exportData = () => {
    try {
      window.open(`${API_URL}/admin/export`, '_blank');
      showToast('Exporting admin database...', 'info');
    } catch (e) {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const dl = document.createElement('a');
      dl.setAttribute('href', dataStr);
      dl.setAttribute('download', 'first-seven-years-admin-export.json');
      dl.click();
      showToast('Exported admin data JSON!', 'info');
    }
  };

  const rebuildSite = async () => {
    showToast('Static build triggered — Rebuilding site via Node.js...', 'info');
    try {
      const res = await api.post('/admin/rebuild-site');
      if (res.data?.success) {
        showToast('Site rebuild finished successfully via Node.js + Python!', 'success');
      } else {
        showToast(`Rebuild note: ${res.data?.message || 'Check terminal'}`, 'info');
      }
    } catch (e: any) {
      const errMsg = e.response?.data?.message || e.message;
      showToast(`Rebuild error: ${errMsg}`, 'error');
    }
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <AdminContext.Provider
      value={{
        data,
        currentUser,
        currentRole,
        isAuthenticated,
        login,
        logout,
        isLoading,
        isDbConnected,
        refreshData,
        searchQuery,
        toasts,
        confirmAction,
        setSearchQuery,
        switchUser,
        togglePublish,
        deleteItem,
        saveItem,
        convertSubmissionToAnswer,
        approveClinical,
        toggleAlertRead,
        markAllAlertsRead,
        resetToDefaults,
        exportData,
        rebuildSite,
        showToast,
        can,
        canEdit,
        canView,
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,
      }}
    >
      {children}
      <ConfirmModal state={confirmState} onClose={closeConfirm} />
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider');
  return ctx;
};
