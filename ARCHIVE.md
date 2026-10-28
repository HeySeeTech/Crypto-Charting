# GitHub 内容归档

归档仓库：https://github.com/HeySeeTech/Crypto-Charting

运行：`python3 scripts/archive_to_github.py --confirm`。仅在用户明确要求同步或归档时运行；日常生成、修改和本地恢复不自动推送 GitHub。

每日文案、Excel、JSON、图表、预览与研究附件按 `archive/YYYY-MM-DD/内容类别/原工作区相对路径` 保存；相同路径的内容修订保留哈希版本。日期优先读取原路径，否则使用北京时间的文件修改日期。文案数据库每天按版本保存；源代码、规则、素材与参考资料保留本地。

只有用户明确提出同步或归档时才执行同步。成功推送并核对远端提交与逐文件 Git blob 校验标识后，才允许删除早于北京时间当天的本地生成文件；平时不做任何清理。上传、认证或校验失败均保留本地文件。当天文件不清理。同步直接复用 GitHub 历史文件对象，无需下载整个历史仓库，不在本地累积仓库历史。

历史分析按需从 GitHub 的 archive/ 读取原 JSON 与来源；临时下载的资料分析完清理。最近成功记录见本地 `.archive-state/last-success.json`。

每次同步自动重建仓库首页的日期总目录、每天 README 文件分类索引及 manifest.json（类别、路径、Git blob 校验标识、字节数）。类别：copy 文案、reports 报表、charts 图表预览、data 来源数据、research 研究资料、logs 校验日志、assets 素材、code 辅助代码、other 其他。旧归档同步迁移，逐文件核对内容后调整路径，历史版本仍保留在 Git 提交中。
