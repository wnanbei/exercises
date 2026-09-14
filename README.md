# 每日拉伸 · Stretch Daily

个人锻炼与拉伸引导网页：纯静态，可直接托管于 GitHub Pages，桌面端与手机端均可流畅访问。

- **4 套预置方案**：久坐办公拉伸 / 肩颈专项 / 晨间唤醒 / 睡前放松
- **引导式会话**：每动作 30 秒自动推进，双侧动作自动换边，支持暂停与跳转
- **动作展示**：参数化 SVG 小人动画 + 方向箭头 + 起始姿势虚影，结构化文字说明
- **肌肉点亮图**：前/后视图解剖图随保持进度渐进点亮，悬停显示中文名称
- **辅助能力**：明暗双主题、合成音效（可静音）、定时提醒、当日进度记忆

灵感与交互参考 [anubhavitis/stretch-daily](https://github.com/anubhavitis/stretch-daily)。

## 本地运行

推荐使用 make（`make help` 查看全部命令）：

```bash
make install     # 安装依赖
make dev         # 启动开发服务器 http://localhost:5173/exercises/
make preview     # 构建并本地预览生产产物
```

也可直接使用 npm 脚本：

```bash
npm install
npm run dev        # 开发服务器
npm run typecheck  # TypeScript strict 类型检查
npm run build      # 生产构建（输出 dist/）
npm run preview    # 预览生产构建
```

## 自定义动作与方案

全部数据在 `src/domain` 下，改动数据文件即可，无需修改组件：

- `src/domain/exercises/`：动作库（按 颈/肩/躯干/下肢 分文件），每个动作声明双语名称、结构化说明、起止姿势角度、方向箭头与肌群负荷
- `src/domain/routines.ts`：方案 = 动作 id 的有序组合 + 元信息
- `src/domain/figures.ts`：坐/站/跪/卧四种基础姿态的骨架参数
- `src/domain/muscles.ts`：body-muscles 肌群 id → 中文名称映射

新增动作后在 `routines.ts` 中引用其 id 即会出现在方案里。

## 部署到 GitHub Pages

仓库已内置 GitHub Actions 工作流（`.github/workflows/deploy.yml`），推送 `main` 分支自动构建部署。首次使用需一次性手动开启：

1. 仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 推送代码后，在 Actions 页签等待部署完成
4. 访问 `https://<用户名>.github.io/exercises/`

Vite `base` 已设为 `/exercises/`；若 fork 后仓库名不同，请同步修改 `vite.config.ts` 中的 `base`。

## 免责声明

本应用不构成医疗建议。如感到疼痛，请立即停止并咨询专业人士。
