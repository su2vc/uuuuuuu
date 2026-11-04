export const MAX_PASSWORD_LENGTH = 8;

// Reject ambiguous configuration instead of silently choosing the first page.
export function createPageRegistry(definitions) {
  const ids = new Set();
  const passwords = new Set();
  return Object.freeze(definitions.map(page => {
    if (typeof page.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.id)) {
      throw new Error('页面 id 必须为小写字母、数字或短横线');
    }
    if (ids.has(page.id)) throw new Error(`重复页面 id：${page.id}`);
    if (typeof page.title !== 'string' || !page.title.trim()) throw new Error(`页面 ${page.id} 缺少标题`);
    if (typeof page.password !== 'string' || !new RegExp(`^\\d{1,${MAX_PASSWORD_LENGTH}}$`).test(page.password)) {
      throw new Error(`页面 ${page.id} 的密码必须为 1–${MAX_PASSWORD_LENGTH} 位数字`);
    }
    if (passwords.has(page.password)) throw new Error('不同页面不能使用同一密码');
    if (typeof page.load !== 'function') throw new Error(`页面 ${page.id} 缺少加载函数`);
    if (page.blocked !== undefined && typeof page.blocked !== 'boolean') {
      throw new Error(`页面 ${page.id} 的 blocked 必须为布尔值`);
    }
    ids.add(page.id);
    passwords.add(page.password);
    return Object.freeze({ ...page, blocked: page.blocked ?? false });
  }));
}

// New experiences live under pages/<id>/ and register here.
export const pages = createPageRegistry([
  {
    id: 'game-album',
    title: '游戏纪念册',
    password: '1020',
    // Preserve the current "未营业" state; this switch affects this page only.
    blocked: true,
    load: () => import('../pages/game-album/index.jsx'),
  },
]);
