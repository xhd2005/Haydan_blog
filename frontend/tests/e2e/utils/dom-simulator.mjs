// frontend/tests/e2e/utils/dom-simulator.mjs
import { config } from '../config.mjs';

/**
 * Hayden Studio VisionOS Headless DOM & Component Interaction Simulator
 * 在无无头浏览器二进制依赖的环境下，高保真模拟组件渲染契约、事件分发与空间美学类名
 */
export class DomSimulator {
  constructor(oracle) {
    this.oracle = oracle;
  }

  // -------------------------------------------------------------
  // 1. 模拟 macOS 悬浮双岛坞渲染契约 (PROJECT.md F5)
  // -------------------------------------------------------------
  renderFloatingDock(isCollapsed = false) {
    const mainIslandItems = [
      { key: 'dashboard', label: '空间指挥', route: '/admin/dashboard', icon: 'LayoutDashboard' },
      { key: 'posts', label: '文章管理', route: '/admin/posts', icon: 'FileText' },
      { key: 'memos', label: '灵感速记', route: '/admin/memos', icon: 'Sparkles' },
      { key: 'media', label: '流光媒体', route: '/admin/media', icon: 'Image' },
      { key: 'graph', label: '知识星系', route: '/admin/graph', icon: 'Network' },
      { key: 'journey', label: '旅行足迹', route: '/admin/journey', icon: 'Compass' },
    ];

    const adminControlIslandItems = [
      { key: 'health', label: '系统体检', route: '/admin/health', icon: 'Activity' },
      { key: 'audit-logs', label: '审计控制台', route: '/admin/audit-logs', icon: 'ShieldCheck' },
      { key: 'settings', label: '系统设置', route: '/admin/settings', icon: 'Settings' },
    ];

    return {
      type: 'FloatingAcrylicDock',
      isCollapsed,
      cssClasses: [
        'fixed',
        'bottom-6',
        'z-50',
        'backdrop-blur-2xl',
        'bg-white/80',
        'dark:bg-neutral-900/60',
        'border',
        'border-slate-200/80',
        'dark:border-white/[0.08]',
        'shadow-2xl',
        'rounded-3xl',
      ],
      mainIsland: {
        itemCount: mainIslandItems.length,
        items: mainIslandItems,
      },
      controlIsland: {
        itemCount: adminControlIslandItems.length,
        items: adminControlIslandItems,
        statusDot: { status: 'ONLINE', color: 'emerald' },
        authorBadge: config.authorName,
      },
      hasFoldToggle: true,
    };
  }

  // -------------------------------------------------------------
  // 2. 模拟多标签工作区 DOM 状态 (PROJECT.md F6)
  // -------------------------------------------------------------
  renderTabsBar() {
    const state = this.oracle.getTabsState();
    return {
      type: 'TabsWorkspaceBar',
      activeTabId: state.activeTabId,
      totalTabs: state.tabs.length,
      mountedTabs: state.tabs.filter(t => t.domMounted),
      unmountedTabs: state.tabs.filter(t => !t.domMounted),
      renderedDomElements: state.tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        isActive: tab.id === state.activeTabId,
        isMounted: tab.domMounted,
        isDirty: tab.isDirty,
        closeButtonVisible: true,
      })),
    };
  }

  // -------------------------------------------------------------
  // 3. 模拟 Spotlight 命令面板唤起与操作 (PROJECT.md F9)
  // -------------------------------------------------------------
  simulateSpotlightInteraction(query = '') {
    const allResults = [];

    // 检索文章
    for (const post of this.oracle.posts) {
      if (!query || post.title.toLowerCase().includes(query.toLowerCase()) || post.slug.includes(query)) {
        allResults.push({ type: 'POST', id: post.id, title: post.title, route: `/admin/posts/edit/${post.id}` });
      }
    }

    // 检索随记
    for (const memo of this.oracle.memos) {
      if (!query || memo.content.toLowerCase().includes(query.toLowerCase())) {
        allResults.push({ type: 'MEMO', id: memo.id, title: memo.content.slice(0, 25), route: '/admin/memos' });
      }
    }

    // 检索媒体
    for (const media of this.oracle.mediaAssets) {
      if (!query || media.name.toLowerCase().includes(query.toLowerCase())) {
        allResults.push({ type: 'MEDIA', id: media.id, title: media.name, route: '/admin/media' });
      }
    }

    // 运维宏
    const macros = [
      { type: 'MACRO', id: 'macro:backup_zip', title: '全量离线 Markdown .zip 备份' },
      { type: 'MACRO', id: 'macro:revalidate_all', title: '全网 ISR 缓存瞬间刷新' },
      { type: 'MACRO', id: 'macro:ban_ip', title: '快速封禁高危 IP 地址' },
    ].filter(m => !query || m.title.toLowerCase().includes(query.toLowerCase()));

    return {
      query,
      isOpen: true,
      results: [...macros, ...allResults],
      inspirationNotePadEnabled: true,
    };
  }

  // -------------------------------------------------------------
  // 4. 模拟二次确认危险拦截弹窗 (AGENTS.md 红线)
  // -------------------------------------------------------------
  simulateConfirmModal({ title, content, variant, onConfirm, onCancel }) {
    const isDanger = variant === 'danger';
    return {
      isOpen: true,
      title,
      content,
      variant,
      isDangerModal: isDanger,
      actionButtons: [
        { label: '取消', type: 'secondary', click: onCancel },
        { label: '确认执行', type: isDanger ? 'danger' : 'primary', click: onConfirm },
      ],
    };
  }

  // -------------------------------------------------------------
  // 5. 模拟 Post Studio 双语分屏与 [[ 联想 (PROJECT.md F27 & F28)
  // -------------------------------------------------------------
  simulatePostStudioEditor(postId) {
    const post = this.oracle.getPostById(postId);
    return {
      postId: post.id,
      title: post.title,
      zenMode: false,
      bilingualSplitScreen: {
        enabled: true,
        leftPanel: { field: 'content', value: post.content, language: 'zh-CN' },
        rightPanel: { field: 'contentEn', value: post.contentEn, language: 'en-US' },
        synchronizedScroll: true,
      },
      triggerWikiLink(prefix = '[[') {
        // 联想全站节点
        return post ? [{ title: '数字花园节点', slug: 'digital-garden-node' }] : [];
      }
    };
  }
}
