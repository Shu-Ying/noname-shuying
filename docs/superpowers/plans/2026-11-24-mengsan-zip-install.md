# 梦三模式首次安装分包 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal** 让梦三首次安装优先使用同源同版本的分包 ZIP，降低请求数并控制解包内存。

**Architecture** 两个发布工作流调用同一个 Python 打包脚本。客户端在现有暂存阶段串行处理附件，对剩余文件复用原有逐文件下载，全部暂存成功后继续执行现有安装事务。

**Tech Stack** Python 标准库 `zipfile` 和 `unittest`、PowerShell 发布工作流、宿主 JSZip 2.7、`DecompressionStream`、Electron HTTPS、Cordova `FileTransfer`、Node.js 测试运行器。

**Spec** `docs/superpowers/specs/2026-11-24-mengsan-zip-install-design.md`

## 全局约束

- GitHub 和 Gitea 发布同一标签对应的分包。客户端使用玩家已选的源和渠道。
- 单次只处理一个独立 ZIP。路径、大小和 SHA-256 以标签的模块清单为准。全部暂存后才安装。
- ZIP 不可用时从同源同标签补齐未完成文件。保留现有事务式安装、卸载与重启后重试。
- 首版只覆盖梦三首次安装。日常差量更新、查漏补缺、旧安装迁移、常规武将与天书乱斗继续使用现有下载方式。
- 实现和验证阶段通过临时测试配置打开 ZIP。两个源的实机验收通过后，再在正式配置默认启用。

## 审查重点

- GitHub 已推送标签，Release 仍在草稿或上传中。首次安装应使用同标签文件下载。
- 一包失败或重试时，其他包已通过校验的暂存文件只安装一次。
- 错误的标签、越界条目和错误字节不得导致正式目录写入未验证的文件。
- 文件系统写入失败应进入现有恢复逻辑。同源回退只处理附件下载、解包或内容校验失败。
- 重启后已知的新装可以重新使用 ZIP。旧版待修复记录和已有安装更新继续走原路径。

## 文件分工

- `tools/build_mengsan_archives.py` · 从正式梦三清单生成并验证分包。
- `.github/workflows/release.yml` 和 `.gitea/workflows/release.yml` · 在现有 ZIP 构建和草稿上传步骤加入分包。
- `update.js` · 查询附件、复用有字节上限的下载、在安装暂存阶段解包及补齐。
- `tools/test_mengsan_archives.py` 和 `tools/test_mengsan_zip_install.mjs` · 覆盖生成规则、正常安装入口及故障分支。
- `tools/UPDATE.md` · 记录附件格式和实机启用条件。

## 任务一 · 构建及核验分包

**接口** `build_archives(root: Path, output: Path, tag: str) -> list[Path]` 使用 `root/dist/modules/mengsan.json`，生成 `mengsan-<tag>-part-001.zip` 等附件。条目名为 `mengsan/…`，与模块清单路径逐字一致。

- [ ] 在 `tools/test_mengsan_archives.py` 写 `test_parts_cover_packable_files_once` 和 `test_reject_inconsistent_release`。用临时目录验证 `Counter(written_paths) == Counter(packable_paths)`、条目 SHA-256 与清单一致、超出 5 MiB 的单文件不入包。对清单版本不匹配、源文件变化和单个分包成品超过 6 MiB 分别断言生成失败。
- [ ] 运行 `python -m unittest discover -s tools -p test_mengsan_archives.py`，确认因生成器尚缺而失败。
- [ ] 实现生成器及 CLI `python tools/build_mengsan_archives.py --root <snapshot> --out-dir <output> --tag <tag>`。按清单路径排序，依次填入每包合计最多 5 MiB 的未压缩文件。使用 `ZIP_DEFLATED`、压缩级别 6。关闭 ZIP 后检查成品不超过 6 MiB，逐项校验路径、大小和 SHA-256，并检查各包合计覆盖所有可打包条目。两个上限是实测起点，调整时同步客户端和测试。
- [ ] 重跑 Python 测试并确认通过。以当前分支生成的清单和导出快照运行 CLI，检查实际分包数、最大包大小和完整覆盖。使用发布工作流同样的标签快照校验命令 `python tools/verify_manifest.py --root <snapshot> --version <version>`。

## 任务二 · 接入两个发布工作流

**接口** 复用任务一的 CLI。每个工作流向现有草稿 Release 上传生成器在单独输出目录产生的所有 `mengsan-<tag>-part-*.zip`，ZIP 附件使用 `application/zip`。

- [ ] 在两个 `release.yml` 的快照验证后调用 Python 构建，并在取消草稿前上传分包。沿用原来生成、上传完整 ZIP 和清单的步骤。CI 继续使用标签快照内的脚本与清单。
- [ ] 更新 `tools/UPDATE.md` 的发布步骤及分包命名。区分标签 raw 清单、梦三 Release 附件和完整离线包。
- [ ] 准备可发布的测试标签后，在获准的测试发布中运行两个工作流。核对同一标签均包含完整 ZIP 和相同编号的分包，完整 ZIP 的原有目录结构保持可用。发版附件下载验证归任务四。

## 任务三 · 在梦三首次安装的暂存阶段接入 ZIP

**接口** `getMengsanReleaseParts(manifest, shuYing) -> Promise<Array<{name: string, url: string, size: number}>>` 返回已选源的同标签分包。`stageMengsanArchives(shuYing, manifest, operationRoot, remaining: Set<string>, stageVerified, progress) -> Promise<void>` 串行读取这些包。`stageVerified(file: string, bytes: Uint8Array) -> Promise<void>` 在写盘前记录尝试，写盘成功后才从 `remaining` 移除文件。

- [ ] 在 `tools/test_mengsan_zip_install.mjs` 用 `node:test` 从正常菜单入口 `manageMengsanModule` 触发安装。`fresh install stages from selected release` 对两个源分别断言附件查询标签正确、成功分包文件无 raw 请求、所有文件备齐前无正式路径写入。`falls back for missing or unusable release parts` 覆盖 Release 404、草稿、标签不匹配、超限响应、损坏 ZIP、越界条目和错误 SHA-256，断言 `rawRequests` 恰好等于未成功暂存文件。`retries the failed ZIP once` 覆盖单包下载异常后成功。`staging write errors preserve recovery` 断言写入失败后无后续 raw 请求。`installed updates and legacy repairs stay on raw` 从 `checkVersion`、`repairMissingFiles` 和旧修复记录分别验证无 Release 请求。至少一个解析用例使用宿主实际捆绑的 JSZip 2.7 和脚本生成的 ZIP。
- [ ] 运行 `node --experimental-vm-modules --test tools/test_mengsan_zip_install.mjs` 并确认新增 ZIP 场景因当前只请求 raw 文件而失败。可通过 `vm.SourceTextModule` 和测试用 `SyntheticModule` 为 `../../noname.js` 注入宿主 API，无需从产品代码导出测试接口。
- [ ] 在 `update.js` 实现附件查询和下载。两源均请求所选 `<repoApi>/releases/tags/<tag>`，要求 `tag_name` 匹配且 `draft` 为 `false`。仅接收与版本文件名匹配、`size` 为正整数且不超过 6 MiB 的附件。使用该源的 HTTPS `browser_download_url`。GitHub 现有附件链接与 CDN 实测缺少浏览器跨域响应头，因此 Electron 使用支持 HTTPS 重定向的原生请求，Cordova 使用 `FileTransfer` 下载到本次操作目录，校验文件大小后读取并清理。网页 Fetch 用尽该附件的网络重试后回退同源逐文件下载。
- [ ] 使用 `get.zip` 获取 JSZip，逐包调用 `load` 读取目录和压缩字节。解包前检查文件名、清单归属、单条目声明大小和包内合计上限。用 `DecompressionStream("deflate-raw")` 解压到按清单大小分配的缓冲区并限制实际输出，随后调用 `verifyFile` 和 `stageVerified`。缺少流式解压能力的客户端直接逐文件下载。异常 ZIP 至多重新取一次再回退。校验、网络和解包错误记录包名及原因。写盘错误从暂存阶段直接抛出。
- [ ] 在 `manageMengsanModule` 判定首次安装。无既有安装，或已明确清空的卸载记录进入全新安装；旧待修复记录按原路径。操作记录只在已知首次安装进入 `installing` 时标记 `freshInstall: true`，失败后该标记用于重新发起完整下载。通过 `installMengsanFiles` 把这个选择传给 `updateAllFiles` 的暂存阶段；本次已完成的文件更新原进度和清理集合，原文件池仅处理剩余项。将 ZIP 网络进度与已验证文件字节分开，避免回退时重复计数。保留现有正式路径落盘前复核及安装记录提交逻辑。
- [ ] 运行 `node --check update.js` 和 Node 测试，确认通过。分别用清单对比正常 ZIP 和逐文件回退的最终目录及安装记录，确认每个新文件大小和 SHA-256 一致。

## 任务四 · 实机验收和默认启用

- [ ] 在同一台受支持手机上，用同一客户端版本、梦三标签、下载源和网络条件，对逐文件和分包的干净安装各测三次。每次从确认安装计时到校验完成。通过网络记录统计资源请求数，从应用及其 WebView 进程记录内存峰值，报告原始样本和中位数。先测 5 MiB 展开、6 MiB 下载上限，再按实测调整。
- [ ] 在客户端真实窗口验证 GitHub 与 Gitea Release 的匿名下载、重定向和跨域行为，并分别验证 ZIP 不可用时回退到当前源的同标签文件。测试手机端强制退出后再点击安装。通过安装记录、清单校验和重启后进入梦三确认结果。另跑桌面端首次安装及差量更新一次。
- [ ] 对照同环境逐文件基线检验收益。建议启用条件为手机端资源请求数和总耗时中位数下降，内存峰值无可重复的上升，两个源与回退均通过。记录采用的包大小、测试设备和结果，再启用默认 ZIP 路径。

## 资料

- [GitHub 按标签查询 Release](https://docs.github.com/en/rest/releases/releases#get-a-release-by-tag-name)
- [GitHub Release 附件字段](https://docs.github.com/en/rest/releases/assets#get-a-release-asset)
- [Gitea 按标签查询 Release](https://docs.gitea.com/api/1.25/operations/repo-get-release-by-tag/)
